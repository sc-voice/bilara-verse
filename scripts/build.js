#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logger } = require('log-instance');
const {
    ExportHtml,
} = require('../index');
const APP_DIR = path.join(__dirname, '..');
const API_DIR = path.join(APP_DIR, 'api');
const TRANS_DIR = path.join(APP_DIR, 'translation/en/sujato/sutta');

(async function(){
    let eh = await new ExportHtml().initialize();
    let suid = "thig4.1";
    let lines = await eh.export(suid, 2);
    let outPath = path.join(TRANS_DIR, 'kn/thig/thig4.1.html');
    await fs.promises.writeFile(outPath, lines.join('\n'));
    console.log(`updated:`, outPath);
})();
