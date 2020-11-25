(function(exports) {
    const fs = require('fs');
    const path = require('path');
    const { logger } = require('log-instance');
    const { 
        BilaraData,
        Seeker,
        SuttaCentralId,
    } = require('scv-bilara');

    class ExportHtml {
        constructor(opts={}) {
            (opts.logger || logger).logInstance(this);
            this.groupBy= opts.groupBy || 'line';
            this.sync = opts.sync;
            this.linebreak = opts.linebreak || '<br/>\n';
            this.scLinks = opts.scLinks;
            this.html = Object.assign({
                title: [
                    '<div class="title" id="$SCID">\n$LINK',
                ],
                verse: [
                    '<div class="verse" id="$SCID">\n$LINK',
                ],
                rootTitle: [
                    '<div class="root_titles" lang="$LANG">',
                ],
                transTitle: [
                    '<div class="translation_titles" lang="$LANG">',
                ],
                rootVerse: [
                    '<p class="pali_verse_paragraph" lang="pi" translate="no">',
                ],
                transVerse: [
                    '<p class="translation_verse_paragraph" lang="$LANG">',
                ],
            }, opts.html);

            let maxResults = this.maxResults = opts.maxResults || 1000;
            let includeUnpublished = opts.includeUnpublished || false;
            let readFile = opts.readFile || false;
            let execGit = opts.execGit;
            let bilaraData = this.bilaraData = opts.bilaraData || new BilaraData({
                includeUnpublished,
                execGit,
                logger: this,
            });
            this.seeker = new Seeker({
                maxResults,
                bilaraData,
                readFile,
                logger: this,
            });
        }

        get initialized() {
            return this.bilaraData.initialized &&
                this.seeker.initialized;
        }

        async initialize() { try {
            await this.bilaraData.initialize(this.sync);
            await this.seeker.initialize();
            return this;
        } catch(e) {
            this.warn(`initialize()`, e.message);
            throw e;
        }}

        suttacentralLink(scid, lang, author_uid) {
            var suid = scid.split(':')[0];
            var linkText = new SuttaCentralId(scid).standardForm();
            var link =  `https://suttacentral.net/${suid}`;
            if (lang) {
                var author = author_uid.split(', ')[0] || author_uid;
                link =  `https://suttacentral.net/${suid}/${lang}/${author}#${scid}`;
            }
            return `<a href="${link}">${linkText}</a>`;
        }

        elementName(elt) {
            return elt.replace(/< *([^ ]*)(\n|.)*/mi,'$1'); 
        }

        elementsOf(html=[],scid,link,lang) {
            return html.map(elt=>{
                elt = elt.replace(/\$SCID/,scid);
                elt = elt.replace(/\$LINK/,link);
                elt = elt.replace(/\$LANG/,lang);
                return elt;
            });
        }

        printVerse(args) {
            let {
                verse, 
                author_uid, 
                lang, 
                showPli, 
                showEn,
            } = args;
            if (!verse.length) {
                return [];
            }
            let scid = args.scid = verse[0].scid;
            args.link = this.suttacentralLink(scid, lang, author_uid);
            return /:0/.test(scid)
                ? this.printAsTitle(args)
                : this.printAsVerse(args);
        }

        printAsTitle(args){
            let {
                verse, 
                author_uid, 
                lang, 
                showPli, 
                showEn,
                scid,
                link,
            } = args;
            let {
                html,
            } = this;
            let lines = [];
            if (showPli) {
                lines = lines.concat(
                    this.printTitleLang(verse, 'pli', undefined, 
                        this.elementsOf(html.rootTitle, scid, link, 'pli')));
            }
            if (showEn) {
                lines = lines.concat(
                    this.printTitleLang(verse, 'en', 'sujato', 
                        this.elementsOf(html.transTitle, scid, link, 'en')));
            }
            lines = lines.concat(
                this.printTitleLang(verse, lang, author_uid, 
                        this.elementsOf(html.transTitle, scid, link, lang)));

            if (lines.length) {
                let elements = this.elementsOf(html.title, scid, link, lang);
                let htmlStart = elements.reduce((a,elt)=>`${a}${elt}`, '');
                let htmlEnd = elements.reduce((a,elt)=>
                    `</${this.elementName(elt)}>${a}`, '');
                lines = [htmlStart, ...lines, htmlEnd];
            }
            return lines;
        }

        printTitleLang(verse, lang, author_uid, elements) {
            var {
                html,
            } = this;
            let lines = [];
            let scid = verse[0].scid;
            let isRoot = lang === 'pli'
            let author = isRoot ? undefined : author_uid;

            let htmlStart = elements.reduce((a,elt)=>`${a}${elt}`, '');
            lines.push(htmlStart);

            verse.forEach((seg,i)=>{
                if (seg[lang]) {
                    let h = `h${i+1}`;
                    lines.push(`<${h}>${seg[lang]}</${h}>`);
                }
            });

            let htmlEnd = elements.reduce((a,elt)=>
                `</${this.elementName(elt)}>${a}`, '');
            lines.push(htmlEnd);
            return lines;
        }

        printAsVerse(args) {
            let {
                verse, 
                author_uid, 
                lang, 
                showPli, 
                showEn,
                scid,
                link,
            } = args;
            let {
                html,
            } = this;
            let lines = [];
            if (showPli) {
                lines = lines.concat(this.printVerseLang(verse, 'pli', undefined,
                    this.elementsOf(html.rootVerse, scid, link, lang)));
            }
            if (showEn) {
                lines = lines.concat(this.printVerseLang(verse, 'en', 'sujato',
                    this.elementsOf(html.transVerse, scid, link, lang)));
            }
            lines = lines.concat(this.printVerseLang(verse, lang, author_uid,
                this.elementsOf(html.transVerse, scid, link, lang)));

            if (lines.length) {
                let elements = this.elementsOf(html.verse, scid, link, lang);
                let htmlStart = elements.reduce((a,elt)=>`${a}${elt}`, '');
                let htmlEnd = elements.reduce((a,elt)=>
                    `</${this.elementName(elt)}>${a}`, '');
                lines = [htmlStart, ...lines, htmlEnd];
            }
            return lines;
        }

        printVerseLang(verse, lang, author_uid, elements) {
            var {
                scLinks,
                linebreak,
                html,
            } = this;
            let lines = [];
            let scid = verse[0].scid;
            let linkLang = lang === 'pli' ? undefined : lang;
            let isRoot = lang === 'pli'
            let author = isRoot ? undefined : author_uid;
            let scLink = scLinks
                ? `${this.suttacentralLink(scid, linkLang, author)} `
                : '';
            let prefix = `${scLink}`;
            let text = verse.reduce((a,seg)=>{
                if (seg[lang]) {
                    a +=  a ? linebreak : prefix;
                    a += seg[lang].trim();
                }
                return a;
            }, '');
            let htmlStart = elements.reduce((a,elt)=>`${a}${elt}`, '');
            let htmlEnd = elements.reduce((a,elt)=>
                `</${this.elementName(elt)}>${a}`, '');
            text && (lines = [ htmlStart, text, htmlEnd, ]);
            return lines;
        }

        exportVerse(res, pattern, n=0) {
            var {
                lang,
                searchLang,
            } = res;
            n = Number(n);
            let showPli = n===2 && searchLang===lang || 
                n>2 && searchLang!=='pli' && lang!=='pli';
            let showEn = n>2 && searchLang!=='en' && lang!=='en';
            let lines = [];
            res.mlDocs.forEach(mld => {
                let {
                    suid,
                    author_uid,
                } = mld;
                let segments = mld.segments();
                let allMatched = segments.reduce((s,a)=>s.matched ? a : false, true);
                let matched = !allMatched;
                let verse = [];
                segments.forEach((seg,i) => {
                    var scid = seg.scid;
                    if (/\.1$/.test(scid)) {
                        if (matched) {
                            lines = lines.concat(
                                this.printVerse({
                                    verse, 
                                    author_uid, 
                                    lang, 
                                    showPli, 
                                    showEn,
                                }));
                        }
                        verse = [];
                        matched = !allMatched;
                    }
                    matched = matched || seg.matched;
                    verse.push(seg);
                    if (i === segments.length && matched) {
                        lines = lines.concat(
                            this.printVerse({
                                verse, 
                                author_uid, 
                                lang, 
                                showPli, 
                                showEn,
                            }));
                    }

                });
            });
            return lines;
        }

        async export(suid, nLang) { try {
            let {
                bilaraData,
                seeker: skr,
            } = this;

            var findOpts = {
                pattern: suid,
                matchHighlight: '',
            };
            logger.info(`findOpts`, findOpts);
            var msStart = Date.now();
            var res = await skr.find(findOpts);
            var secElapsed = (Date.now() - msStart)/1000;
            logger.info(`find() ${secElapsed.toFixed(1)}s`);
            return this.exportVerse(res, suid, nLang);
        } catch(e) { 
            this.warn(`export()`, e.message);
            throw e;
        }}
    }

    module.exports = exports.ExportHtml = ExportHtml;
})(typeof exports === "object" ? exports : (exports = {}));
