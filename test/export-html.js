(typeof describe === 'function') && describe("export-html", function() {
    const should = require("should");
    const {
        BilaraData,
        Seeker,
    } = require('scv-bilara');
    const {
        ExportHtml,
    } = require("../index");
    this.timeout(5*1000);

    it("TESTTESTdefault ctor", ()=>{
        let eh = new ExportHtml();
        should(eh.bilaraData).instanceOf(BilaraData);
        should(eh.seeker).instanceOf(Seeker);
    });
    it("TESTTESTinitialize()", async()=>{
        let eh = new ExportHtml();

        // constructor does not initialize
        should(eh.bilaraData.initialized).equal(false);
        should(eh.seeker.initialized).equal(false);
        should(eh.initialized).equal(false);

        should(await eh.initialize()).equal(eh);
        should(eh.bilaraData.initialized).equal(true);
        should(eh.seeker.initialized).equal(true);
        should(eh.initialized).equal(true);

        // initialize can be called more than once
        should(await eh.initialize()).equal(eh);
        should(eh.bilaraData.initialized).equal(true);
        should(eh.seeker.initialized).equal(true);
        should(eh.initialized).equal(true);
    });
    it("TESTTESTexport(suid)", async()=>{
        let eh = await new ExportHtml().initialize();
        let lines = await eh.export('thig4.1', 2);
        should.deepEqual(lines.slice(0,12),[
            '<div class=\"title\" id=\"thig4.1:0.1\">\n<a href=\"https://suttacentral.net/thig4.1/en/sujato#thig4.1:0.1\">Thig4.1:0.1</a>',
            '<div class=\"root_titles\" lang=\"pli\">',
            '<h1>Therīgāthā</h1>',
            '<h2>Catukkanipāta</h2>',
            '<h3>1. Bhaddākāpilānītherīgāthā</h3>',
            '</div>',
            '<div class=\"translation_titles\" lang=\"en\">',
            '<h1>Verses of the Senior Nuns</h1>',
            '<h2>The Book of the Fours</h2>',
            '<h3>4.1. Bhaddā Kāpilānī</h3>',
            '</div>',
            '</div>',
        ]);
        should.deepEqual(lines.slice(-5),[
            '<div class=\"verse\" id=\"thig4.1:5.1\">\n<a href=\"https://suttacentral.net/thig4.1/en/sujato#thig4.1:5.1\">Thig4.1:5.1</a>',
            '<p class=\"pali_verse_paragraph\" lang=\"pi\" translate=\"no\">',
            '…<br/>\nBhaddā kāpilānī therī ….',
            '</p>',
            '</div>',
        ]);
        should(lines.length).equal(49);
    });
});
