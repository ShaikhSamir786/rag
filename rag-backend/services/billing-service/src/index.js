const express = require('express');
const { logger } = require('@rag-platform/logger');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    logger.info(\`Billing Service running on port \${PORT}\`);
});
