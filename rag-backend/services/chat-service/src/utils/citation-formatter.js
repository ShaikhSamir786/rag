class CitationFormatter {
    formatCitations(citations) {
        if (!Array.isArray(citations) || citations.length === 0) {
            return '';
        }

        return citations.map((citation, index) => {
            return `[${index + 1}] ${citation.source}${citation.score ? ` (relevance: ${(citation.score * 100).toFixed(1)}%)` : ''}`;
        }).join('\n');
    }

    formatInlineReferences(content, citations) {
        if (!citations || citations.length === 0) {
            return content;
        }

        let formattedContent = content;

        // Add citation markers if not present
        citations.forEach((citation, index) => {
            const marker = `[${index + 1}]`;
            if (!formattedContent.includes(marker)) {
                // Try to intelligently place citation
                // This is a simple implementation - could be improved
                formattedContent += ` ${marker}`;
            }
        });

        return formattedContent;
    }

    formatCitationFootnotes(citations) {
        if (!Array.isArray(citations) || citations.length === 0) {
            return '';
        }

        const footnotes = citations.map((citation, index) => {
            let footnote = `[${index + 1}] ${citation.source}`;

            if (citation.score) {
                footnote += ` (Relevance: ${(citation.score * 100).toFixed(1)}%)`;
            }

            if (citation.content) {
                const preview = citation.content.length > 100
                    ? citation.content.substring(0, 100) + '...'
                    : citation.content;
                footnote += `\n    "${preview}"`;
            }

            return footnote;
        }).join('\n\n');

        return `\n\n---\nSources:\n${footnotes}`;
    }

    extractCitationNumbers(content) {
        const regex = /\[(\d+)\]/g;
        const matches = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            matches.push(parseInt(match[1]));
        }

        return [...new Set(matches)].sort((a, b) => a - b);
    }

    validateCitations(content, citations) {
        const citationNumbers = this.extractCitationNumbers(content);
        const availableCitations = citations.length;

        const invalid = citationNumbers.filter(num => num > availableCitations);

        if (invalid.length > 0) {
            return {
                valid: false,
                invalidNumbers: invalid,
                message: `Invalid citation numbers: ${invalid.join(', ')}`
            };
        }

        return { valid: true };
    }

    formatForMarkdown(citations) {
        if (!Array.isArray(citations) || citations.length === 0) {
            return '';
        }

        return citations.map((citation, index) => {
            let md = `${index + 1}. **${citation.source}**`;

            if (citation.score) {
                md += ` _(${(citation.score * 100).toFixed(1)}% relevant)_`;
            }

            if (citation.content) {
                const preview = citation.content.length > 150
                    ? citation.content.substring(0, 150) + '...'
                    : citation.content;
                md += `\n   > ${preview}`;
            }

            return md;
        }).join('\n\n');
    }
}

module.exports = new CitationFormatter();
