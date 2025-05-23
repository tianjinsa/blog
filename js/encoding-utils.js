/**
 * 编码诊断和修复工具
 * 用于处理文本编码问题
 */

class EncodingUtils {
    /**
     * 打印文本编码诊断信息
     * @param {string} label - 诊断标签 
     * @param {string} text - 要诊断的文本
     */
    static diagnose(label, text) {
        if (!text || typeof text !== 'string') {
            console.error(`${label}: 不是有效的字符串`, text);
            return;
        }

        const info = {
            length: text.length,
            hasChinese: /[\u4e00-\u9fa5]/.test(text),
            hasSpecialChars: /[^\x00-\x7F]/.test(text),
            firstFewChars: text.substring(0, 50),
            charCodes: Array.from(text.substring(0, 20)).map(c => c.charCodeAt(0))
        };
        
        console.log(`诊断 - ${label}:`, info);
        return info;
    }
    
    /**
     * 修复可能的编码问题
     * @param {string} text - 要修复的文本
     * @returns {string} 修复后的文本
     */
    static fix(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        
        // 尝试修复常见编码问题
        return text
            // 修复 UTF-8 被错误解释为 Latin1 的情况
            .replace(/Ã(\w)/g, match => {
                const charCode = match.charCodeAt(1);
                if (charCode >= 128 && charCode <= 191) {
                    return String.fromCharCode(((match.charCodeAt(0) & 0x3F) << 6) | 
                                               (match.charCodeAt(1) & 0x3F));
                }
                return match;
            });
    }
    
    /**
     * 检测文本是否包含乱码
     * @param {string} text - 要检测的文本
     * @returns {boolean} 是否包含可能的乱码
     */
    static containsGarbage(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }
        
        // 检查一些常见的乱码模式
        return /Ã.|â..|ï¿½/.test(text);
    }
}

// 全局可访问
window.EncodingUtils = EncodingUtils;
