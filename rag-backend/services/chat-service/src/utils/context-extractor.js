const { logger } = require('@rag-platform/logger');

/**
 * Context Extractor
 * Extracts and formats context information for question generation
 */
class ContextExtractor {
    /**
     * Extract context from code snippet
     * @param {string} code - Code snippet
     * @param {Object} options - Extraction options
     * @returns {Object} Extracted context
     */
    extractFromCode(code, options = {}) {
        try {
            const context = {
                functions: this._extractFunctions(code),
                classes: this._extractClasses(code),
                variables: this._extractVariables(code),
                imports: this._extractImports(code),
                exports: this._extractExports(code),
                comments: this._extractComments(code),
                keywords: this._extractKeywords(code)
            };

            return context;

        } catch (error) {
            logger.error('Error extracting context from code:', error);
            return {};
        }
    }

    /**
     * Extract function signatures
     * @private
     */
    _extractFunctions(code) {
        const functions = [];

        // Regular function declarations
        const funcRegex = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
        let match;
        while ((match = funcRegex.exec(code)) !== null) {
            functions.push({
                name: match[1],
                params: match[2].split(',').map(p => p.trim()).filter(Boolean),
                async: match[0].includes('async')
            });
        }

        // Arrow functions assigned to variables
        const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;
        while ((match = arrowRegex.exec(code)) !== null) {
            functions.push({
                name: match[1],
                params: match[2].split(',').map(p => p.trim()).filter(Boolean),
                async: match[0].includes('async'),
                arrow: true
            });
        }

        return functions;
    }

    /**
     * Extract class definitions
     * @private
     */
    _extractClasses(code) {
        const classes = [];
        const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;

        let match;
        while ((match = classRegex.exec(code)) !== null) {
            classes.push({
                name: match[1],
                extends: match[2] || null
            });
        }

        return classes;
    }

    /**
     * Extract variable declarations
     * @private
     */
    _extractVariables(code) {
        const variables = [];
        const varRegex = /(const|let|var)\s+(\w+)\s*=/g;

        let match;
        while ((match = varRegex.exec(code)) !== null) {
            variables.push({
                name: match[2],
                type: match[1]
            });
        }

        return variables;
    }

    /**
     * Extract import statements
     * @private
     */
    _extractImports(code) {
        const imports = [];

        // ES6 imports
        const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push({
                named: match[1] ? match[1].split(',').map(i => i.trim()) : [],
                default: match[2] || null,
                from: match[3]
            });
        }

        // CommonJS requires
        const requireRegex = /(?:const|let|var)\s+(?:{([^}]+)}|(\w+))\s*=\s*require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(code)) !== null) {
            imports.push({
                named: match[1] ? match[1].split(',').map(i => i.trim()) : [],
                default: match[2] || null,
                from: match[3],
                commonjs: true
            });
        }

        return imports;
    }

    /**
     * Extract export statements
     * @private
     */
    _extractExports(code) {
        const exports = [];

        // ES6 exports
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)/g;
        let match;
        while ((match = exportRegex.exec(code)) !== null) {
            exports.push({
                name: match[1],
                default: match[0].includes('default')
            });
        }

        // CommonJS exports
        if (code.includes('module.exports')) {
            exports.push({
                name: 'module.exports',
                commonjs: true
            });
        }

        return exports;
    }

    /**
     * Extract comments
     * @private
     */
    _extractComments(code) {
        const comments = [];

        // Single-line comments
        const singleLineRegex = /\/\/(.+)$/gm;
        let match;
        while ((match = singleLineRegex.exec(code)) !== null) {
            comments.push({
                type: 'single',
                text: match[1].trim()
            });
        }

        // Multi-line comments
        const multiLineRegex = /\/\*\*?([\s\S]*?)\*\//g;
        while ((match = multiLineRegex.exec(code)) !== null) {
            comments.push({
                type: 'multi',
                text: match[1].trim(),
                jsdoc: match[0].startsWith('/**')
            });
        }

        return comments;
    }

    /**
     * Extract important keywords
     * @private
     */
    _extractKeywords(code) {
        const keywords = {
            async: (code.match(/\basync\b/g) || []).length,
            await: (code.match(/\bawait\b/g) || []).length,
            promise: (code.match(/\bPromise\b/g) || []).length,
            try: (code.match(/\btry\b/g) || []).length,
            catch: (code.match(/\bcatch\b/g) || []).length,
            throw: (code.match(/\bthrow\b/g) || []).length,
            return: (code.match(/\breturn\b/g) || []).length
        };

        return keywords;
    }

    /**
     * Format context for display
     * @param {Object} context - Context object
     * @returns {string} Formatted context
     */
    formatContext(context) {
        const parts = [];

        if (context.functions && context.functions.length > 0) {
            parts.push('**Functions:**');
            context.functions.forEach(fn => {
                const params = fn.params.join(', ');
                const async = fn.async ? 'async ' : '';
                parts.push(`- ${async}${fn.name}(${params})`);
            });
        }

        if (context.classes && context.classes.length > 0) {
            parts.push('\n**Classes:**');
            context.classes.forEach(cls => {
                const ext = cls.extends ? ` extends ${cls.extends}` : '';
                parts.push(`- ${cls.name}${ext}`);
            });
        }

        if (context.imports && context.imports.length > 0) {
            parts.push('\n**Imports:**');
            context.imports.slice(0, 5).forEach(imp => {
                parts.push(`- ${imp.from}`);
            });
        }

        return parts.join('\n');
    }

    /**
     * Extract context summary
     * @param {Object} context - Context object
     * @returns {string} Summary
     */
    getSummary(context) {
        const summary = [];

        if (context.functions?.length > 0) {
            summary.push(`${context.functions.length} function(s)`);
        }

        if (context.classes?.length > 0) {
            summary.push(`${context.classes.length} class(es)`);
        }

        if (context.imports?.length > 0) {
            summary.push(`${context.imports.length} import(s)`);
        }

        return summary.join(', ') || 'No significant context found';
    }
}

module.exports = new ContextExtractor();
