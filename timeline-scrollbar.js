/**
 * 时间线风格滚动条 - 移动端优化
 * 类似手机相册时间线的滚动体验
 */

class TimelineScrollbar {    constructor() {
        this.container = null;
        this.track = null;
        this.progress = null;
        this.thumb = null;
        this.markers = null;
        this.isDragging = false;
        this.sections = [];
        this.currentSection = 0;
        this.autoHide = null;
        
        // 节流函数
        this.throttle = (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        };
        
        this.init();
    }    init() {
        // 临时：为了测试，允许在所有屏幕尺寸下显示
        // 正式版本应该改回 window.innerWidth > 768
        if (false && window.innerWidth > 768) {
            console.log('时间线滚动条: 屏幕宽度大于768px，跳过初始化');
            return;
        }
        
        console.log('时间线滚动条: 开始初始化移动端滚动条');
        
        this.createScrollbar();
        this.bindEvents();
        this.updateSections();
        
        // 延迟显示，确保内容加载完成
        setTimeout(() => {
            this.updateScrollbar();
            this.showScrollbar();
            console.log('时间线滚动条: 初始化完成');
        }, 500);
    }
    
    createScrollbar() {
        // 创建时间线滚动条HTML结构
        const html = `
            <div class="timeline-scrollbar" id="timeline-scrollbar">
                <div class="timeline-track">
                    <div class="timeline-progress"></div>
                    <div class="timeline-thumb"></div>
                    <div class="timeline-markers"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        // 获取元素引用
        this.container = document.getElementById('timeline-scrollbar');
        this.track = this.container.querySelector('.timeline-track');
        this.progress = this.container.querySelector('.timeline-progress');
        this.thumb = this.container.querySelector('.timeline-thumb');
        this.markers = this.container.querySelector('.timeline-markers');
    }
    
    updateSections() {
        // 获取文章中的所有标题作为导航点
        const headings = document.querySelectorAll('.blog-post-content h1, .blog-post-content h2, .blog-post-content h3');
        this.sections = [];
        
        // 添加文章开头
        this.sections.push({
            element: document.querySelector('.blog-post-header') || document.querySelector('.blog-post'),
            title: '文章开头',
            level: 0
        });
        
        // 添加所有标题
        headings.forEach((heading, index) => {
            this.sections.push({
                element: heading,
                title: heading.textContent.trim(),
                level: parseInt(heading.tagName.substring(1))
            });
        });
        
        // 添加文章结尾
        const lastElement = document.querySelector('.blog-post-content').lastElementChild;
        if (lastElement) {
            this.sections.push({
                element: lastElement,
                title: '文章结尾',
                level: 0
            });
        }
        
        this.createMarkers();
    }
      createMarkers() {
        if (!this.markers || this.sections.length === 0) return;
        
        // 清空现有标记
        this.markers.innerHTML = '';
        
        // 为每个section创建标记点
        this.sections.forEach((section, index) => {
            const marker = document.createElement('div');
            marker.className = `timeline-marker level-${section.level}`;
            marker.dataset.index = index;
            
            // 计算标记位置
            const position = (index / (this.sections.length - 1)) * 100;
            marker.style.top = `${position}%`;
            
            // 创建标签
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.textContent = section.title.length > 15 
                ? section.title.substring(0, 15) + '...' 
                : section.title;
            marker.appendChild(label);
            
            // 添加点击/触摸事件
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.scrollToSection(index);
            });
            
            // 优化触摸体验
            marker.addEventListener('touchstart', (e) => {
                e.preventDefault();
                marker.classList.add('touching');
            });
            
            marker.addEventListener('touchend', (e) => {
                e.preventDefault();
                marker.classList.remove('touching');
                this.scrollToSection(index);
            });
            
            this.markers.appendChild(marker);
        });
    }
    
    bindEvents() {
        if (!this.container) return;
        
        // 滚动事件监听
        window.addEventListener('scroll', this.throttle(() => {
            this.updateScrollbar();
        }, 50));
        
        // 拖拽事件
        this.thumb.addEventListener('mousedown', this.startDrag.bind(this));
        this.thumb.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
        
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
        
        // 轨道点击事件
        this.track.addEventListener('click', this.trackClick.bind(this));
        
        // 窗口大小变化
        window.addEventListener('resize', this.throttle(() => {
            if (window.innerWidth > 768) {
                this.hideScrollbar();
            } else {
                this.showScrollbar();
                this.updateScrollbar();
            }
        }, 200));
        
        // 内容变化监听
        const observer = new MutationObserver(() => {
            this.updateSections();
            this.updateScrollbar();
        });
        
        const content = document.querySelector('.blog-post-content');
        if (content) {
            observer.observe(content, { 
                childList: true, 
                subtree: true 
            });
        }
    }
      startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.thumb.classList.add('dragging');
        
        // 添加触摸类名
        if (e.type.includes('touch')) {
            this.thumb.classList.add('touching');
        }
        
        document.body.style.userSelect = 'none';
        
        // 显示时间线并阻止自动隐藏
        if (this.autoHide) {
            this.autoHide.show();
            clearTimeout(this.autoHide.hideTimer);
        }
    }
    
    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const rect = this.track.getBoundingClientRect();
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const relativeY = clientY - rect.top;
        const percentage = Math.max(0, Math.min(1, relativeY / rect.height));
        
        // 计算目标滚动位置
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = percentage * maxScroll;
        
        // 平滑滚动到目标位置
        window.scrollTo({
            top: targetScroll,
            behavior: 'auto'
        });
    }
    
    endDrag() {
        this.isDragging = false;
        this.thumb.classList.remove('dragging', 'touching');
        document.body.style.userSelect = '';
        
        // 重新启动自动隐藏
        if (this.autoHide) {
            this.autoHide.resetHideTimer();
        }
    }
    
    trackClick(e) {
        if (e.target === this.thumb || this.isDragging) return;
        
        const rect = this.track.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const percentage = Math.max(0, Math.min(1, relativeY / rect.height));
        
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = percentage * maxScroll;
        
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }
    
    scrollToSection(index) {
        if (index < 0 || index >= this.sections.length) return;
        
        const section = this.sections[index];
        const rect = section.element.getBoundingClientRect();
        const offsetTop = window.pageYOffset + rect.top - 80; // 留出导航栏空间
        
        window.scrollTo({
            top: Math.max(0, offsetTop),
            behavior: 'smooth'
        });
        
        // 更新当前section
        this.currentSection = index;
        this.updateActiveMarker();
    }
    
    updateScrollbar() {
        if (!this.container || window.innerWidth > 768) return;
        
        const scrollTop = window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        if (maxScroll <= 0) return;
        
        const percentage = (scrollTop / maxScroll) * 100;
        
        // 更新进度条
        this.progress.style.height = `${percentage}%`;
        
        // 更新滑块位置
        this.thumb.style.top = `${percentage}%`;
        
        // 更新当前激活的section
        this.updateCurrentSection();
        this.updateActiveMarker();
    }
    
    updateCurrentSection() {
        const scrollTop = window.pageYOffset + 100; // 偏移量
        
        for (let i = this.sections.length - 1; i >= 0; i--) {
            const section = this.sections[i];
            const rect = section.element.getBoundingClientRect();
            const elementTop = window.pageYOffset + rect.top;
            
            if (scrollTop >= elementTop) {
                this.currentSection = i;
                break;
            }
        }
    }
    
    updateActiveMarker() {
        const markers = this.markers.querySelectorAll('.timeline-marker');
        markers.forEach((marker, index) => {
            marker.classList.toggle('active', index === this.currentSection);
        });
    }
    
    showScrollbar() {
        if (this.container && window.innerWidth <= 768) {
            this.container.classList.add('active');
        }
    }
    
    hideScrollbar() {
        if (this.container) {
            this.container.classList.remove('active');
        }
    }
    
    // 公共方法：手动刷新
    refresh() {
        this.updateSections();
        this.updateScrollbar();
    }
    
    // 公共方法：销毁
    destroy() {
        if (this.container) {
            this.container.remove();
        }
    }
}

// 自动隐藏功能
class TimelineAutoHide {
    constructor(scrollbar) {
        this.scrollbar = scrollbar;
        this.hideTimer = null;
        this.isVisible = false;
        this.lastScrollTime = 0;
        
        this.bindAutoHideEvents();
    }
    
    bindAutoHideEvents() {
        // 滚动时显示，停止滚动后自动隐藏
        window.addEventListener('scroll', () => {
            this.show();
            this.resetHideTimer();
        });
        
        // 触摸时显示
        document.addEventListener('touchstart', () => {
            this.show();
        });
        
        // 触摸结束后延迟隐藏
        document.addEventListener('touchend', () => {
            this.resetHideTimer();
        });
    }
    
    show() {
        if (this.scrollbar.container) {
            this.scrollbar.container.classList.add('visible');
            this.isVisible = true;
        }
    }
    
    hide() {
        if (this.scrollbar.container && !this.scrollbar.isDragging) {
            this.scrollbar.container.classList.remove('visible');
            this.isVisible = false;
        }
    }
    
    resetHideTimer() {
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            this.hide();
        }, 2000); // 2秒后自动隐藏
    }
}

// 初始化时间线滚动条
let timelineScrollbar = null;
let timelineAutoHide = null;

// 初始化函数
function initTimelineScrollbar() {
    // 临时：为了测试，允许在所有屏幕尺寸下显示
    // 正式版本应该改回 window.innerWidth <= 768
    if (true || window.innerWidth <= 768) {
        console.log('时间线滚动条: 开始初始化');
        timelineScrollbar = new TimelineScrollbar();
        timelineAutoHide = new TimelineAutoHide(timelineScrollbar);
        
        // 将自动隐藏实例绑定到滚动条
        timelineScrollbar.autoHide = timelineAutoHide;
    }
}

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 延迟初始化，确保文章内容已加载
        setTimeout(initTimelineScrollbar, 1000);
    });
} else {
    // DOM已经加载完成
    setTimeout(initTimelineScrollbar, 1000);
}

// 导出到全局作用域
window.TimelineScrollbar = TimelineScrollbar;
window.TimelineAutoHide = TimelineAutoHide;
window.timelineScrollbar = timelineScrollbar;
window.initTimelineScrollbar = initTimelineScrollbar;
