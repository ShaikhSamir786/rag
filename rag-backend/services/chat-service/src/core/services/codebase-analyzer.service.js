const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const ignore = require('ignore');
const { logger } = require('@rag-platform/logger');

/**
 * Codebase Analyzer Service
 * Analyzes codebase structure and extracts context for question generation
 */
class CodebaseAnalyzerService {
    constructor() {
        this.maxFilesToAnalyze = parseInt(process.env.CODEBASE_MAX_FILES_ANALYZE || '100', 10);
        this.excludedDirs = (process.env.CODEBASE_EXCLUDED_DIRS || 'node_modules,dist,build,.git').split(',');
        this.excludedExtensions = (process.env.CODEBASE_EXCLUDED_EXTENSIONS || '.log,.lock,.md').split(',');
    }

    /**
     * Analyze context for question generation
     * @param {Object} context - Context information
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeContext(context) {
        try {
            const analysis = {
                currentFile: null,
                dependencies: [],
                patterns: [],
                framework: null,
                relatedFiles: [],
                codeStructure: null,
                recentChanges: []
            };

            // Analyze current file if provided
            if (context.currentFile) {
                analysis.currentFile = await this.analyzeFile(context.currentFile);
                analysis.dependencies = await this.extractDependencies(context.currentFile);
            }

            // Analyze selected code if provided
            if (context.selectedCode) {
                analysis.codeStructure = this._analyzeCodeStructure(context.selectedCode);
            }

            // Detect patterns and framework
            analysis.patterns = await this.detectPatterns(context);
            analysis.framework = this._detectFramework(analysis.dependencies);

            // Find related files
            if (context.currentFile) {
                analysis.relatedFiles = await this._findRelatedFiles(context.currentFile, analysis.dependencies);
            }

            logger.info('Context analysis completed', {
                file: context.currentFile,
                patternsFound: analysis.patterns.length
            });

            return analysis;

        } catch (error) {
            logger.error('Error analyzing context:', error);
            return {
                currentFile: null,
                dependencies: [],
                patterns: [],
                framework: null,
                relatedFiles: [],
                codeStructure: null,
                recentChanges: []
            };
        }
    }

    /**
     * Analyze a single file
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} File analysis
     */
    async analyzeFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);

            return {
                path: filePath,
                name: path.basename(filePath),
                extension: path.extname(filePath),
                size: stats.size,
                lines: content.split('\n').length,
                language: this._detectLanguage(filePath),
                hasTests: this._hasTests(content),
                hasComments: this._hasComments(content),
                complexity: this._estimateComplexity(content)
            };

        } catch (error) {
            logger.error('Error analyzing file:', error);
            return null;
        }
    }

    /**
     * Extract dependencies from a file
     * @param {string} filePath - Path to file
     * @returns {Promise<string[]>} List of dependencies
     */
    async extractDependencies(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const dependencies = [];

            // Extract require() statements
            const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
            let match;
            while ((match = requireRegex.exec(content)) !== null) {
                dependencies.push(match[1]);
            }

            // Extract import statements
            const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
            while ((match = importRegex.exec(content)) !== null) {
                dependencies.push(match[1]);
            }

            // Extract dynamic imports
            const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
            while ((match = dynamicImportRegex.exec(content)) !== null) {
                dependencies.push(match[1]);
            }

            return [...new Set(dependencies)]; // Remove duplicates

        } catch (error) {
            logger.error('Error extracting dependencies:', error);
            return [];
        }
    }

    /**
     * Detect coding patterns in the context
     * @param {Object} context - Context information
     * @returns {Promise<string[]>} Detected patterns
     */
    async detectPatterns(context) {
        try {
            const patterns = [];

            // Analyze current file content
            let content = '';
            if (context.currentFile) {
                try {
                    content = await fs.readFile(context.currentFile, 'utf-8');
                } catch (error) {
                    logger.warn('Could not read current file for pattern detection');
                }
            }

            // Add selected code to analysis
            if (context.selectedCode) {
                content += '\n' + context.selectedCode;
            }

            if (!content) {
                return patterns;
            }

            // Detect async/await pattern
            if (content.includes('async') && content.includes('await')) {
                patterns.push('async-await');
            }

            // Detect Promise pattern
            if (content.includes('.then(') || content.includes('.catch(')) {
                patterns.push('promises');
            }

            // Detect class-based pattern
            if (content.includes('class ') && content.includes('extends')) {
                patterns.push('class-inheritance');
            }

            // Detect functional pattern
            if (content.includes('=>') || content.includes('function(')) {
                patterns.push('functional-programming');
            }

            // Detect error handling
            if (content.includes('try') && content.includes('catch')) {
                patterns.push('error-handling');
            }

            // Detect middleware pattern
            if (content.includes('(req, res, next)') || content.includes('middleware')) {
                patterns.push('express-middleware');
            }

            // Detect repository pattern
            if (content.includes('repository') || content.includes('Repository')) {
                patterns.push('repository-pattern');
            }

            // Detect service pattern
            if (content.includes('service') || content.includes('Service')) {
                patterns.push('service-pattern');
            }

            // Detect factory pattern
            if (content.includes('factory') || content.includes('Factory') || content.includes('create')) {
                patterns.push('factory-pattern');
            }

            // Detect dependency injection
            if (content.includes('constructor(') && content.includes('this.')) {
                patterns.push('dependency-injection');
            }

            // Detect validation
            if (content.includes('validate') || content.includes('joi') || content.includes('yup')) {
                patterns.push('validation');
            }

            // Detect logging
            if (content.includes('logger') || content.includes('console.log')) {
                patterns.push('logging');
            }

            // Detect database operations
            if (content.includes('findOne') || content.includes('findById') || content.includes('create') || content.includes('update')) {
                patterns.push('database-operations');
            }

            return patterns;

        } catch (error) {
            logger.error('Error detecting patterns:', error);
            return [];
        }
    }

    /**
     * Analyze project structure
     * @param {string} workspacePath - Path to workspace
     * @returns {Promise<Object>} Project structure analysis
     */
    async analyzeProject(workspacePath) {
        try {
            // This is a placeholder for full project analysis
            // Can be implemented for more comprehensive codebase understanding
            logger.info('Analyzing project structure', { workspacePath });

            return {
                rootPath: workspacePath,
                fileCount: 0,
                directories: [],
                languages: [],
                frameworks: []
            };

        } catch (error) {
            logger.error('Error analyzing project:', error);
            return null;
        }
    }

    /**
     * Detect framework from dependencies
     * @private
     */
    _detectFramework(dependencies) {
        const frameworks = {
            'express': 'Express.js',
            'next': 'Next.js',
            'react': 'React',
            'vue': 'Vue.js',
            'angular': 'Angular',
            'nestjs': 'NestJS',
            'fastify': 'Fastify',
            'koa': 'Koa',
            'mongoose': 'Mongoose/MongoDB',
            'sequelize': 'Sequelize',
            'typeorm': 'TypeORM'
        };

        for (const dep of dependencies) {
            for (const [key, value] of Object.entries(frameworks)) {
                if (dep.includes(key)) {
                    return value;
                }
            }
        }

        return null;
    }

    /**
     * Find related files based on dependencies
     * @private
     */
    async _findRelatedFiles(currentFile, dependencies) {
        try {
            const relatedFiles = [];
            const currentDir = path.dirname(currentFile);

            for (const dep of dependencies) {
                // Skip external dependencies (node_modules)
                if (!dep.startsWith('.') && !dep.startsWith('/')) {
                    continue;
                }

                // Resolve relative path
                const resolvedPath = path.resolve(currentDir, dep);

                // Try common extensions
                const extensions = ['.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts'];
                for (const ext of extensions) {
                    const filePath = resolvedPath + ext;
                    try {
                        await fs.access(filePath);
                        relatedFiles.push(filePath);
                        break;
                    } catch (error) {
                        // File doesn't exist, try next extension
                    }
                }
            }

            return relatedFiles;

        } catch (error) {
            logger.error('Error finding related files:', error);
            return [];
        }
    }

    /**
     * Detect programming language from file extension
     * @private
     */
    _detectLanguage(filePath) {
        const ext = path.extname(filePath);
        const languageMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'JavaScript (React)',
            '.tsx': 'TypeScript (React)',
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.rb': 'Ruby',
            '.php': 'PHP'
        };

        return languageMap[ext] || 'Unknown';
    }

    /**
     * Check if file has tests
     * @private
     */
    _hasTests(content) {
        const testKeywords = ['describe(', 'it(', 'test(', 'expect(', 'assert'];
        return testKeywords.some(keyword => content.includes(keyword));
    }

    /**
     * Check if file has comments
     * @private
     */
    _hasComments(content) {
        return content.includes('//') || content.includes('/*') || content.includes('/**');
    }

    /**
     * Estimate code complexity
     * @private
     */
    _estimateComplexity(content) {
        let complexity = 0;

        // Count control flow statements
        const controlFlowKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
        for (const keyword of controlFlowKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }

        // Categorize complexity
        if (complexity < 10) return 'low';
        if (complexity < 30) return 'medium';
        return 'high';
    }

    /**
     * Analyze code structure
     * @private
     */
    _analyzeCodeStructure(code) {
        return {
            hasClasses: code.includes('class '),
            hasFunctions: code.includes('function ') || code.includes('=>'),
            hasAsync: code.includes('async'),
            hasExports: code.includes('export') || code.includes('module.exports'),
            hasImports: code.includes('import') || code.includes('require('),
            linesOfCode: code.split('\n').length
        };
    }
}

module.exports = new CodebaseAnalyzerService();
