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
    let suttaIds = eh.bilaraData.suttaIds
        .filter(id=>id.startsWith('thig') || id.startsWith('thag'));
    for (let i = 0; i < suttaIds.length; i++) {
        let suid = suttaIds[i];
        let lines = await eh.export(suid, 2);
        let folder = suid.replace(/[0-9].*/u,'');
        let outPath = path.join(TRANS_DIR, `kn/${folder}/${suid}.html`);
        await fs.promises.writeFile(outPath, lines.join('\n'));
        console.log(`updated:`, outPath);
    }
})();
