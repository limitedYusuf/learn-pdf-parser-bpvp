new Vue({
  el: '#app',
  data() {
    return {
      file: null,
      rule: 'Batas Akhir Bayar : {value}',
      result: null,
      parsedText: '',
      showFullText: false,
    };
  },
  methods: {
    onFileChange(event) {
      this.file = event.target.files[0];
    },
    parsePDF() {
      if (this.file && this.rule) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const pdfData = new Uint8Array(e.target.result);
          pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
            let extractedData = [];
            const pagePromises = [];

            for (let i = 1; i <= pdf.numPages; i++) {
              pagePromises.push(pdf.getPage(i).then((page) => {
                return page.getTextContent().then((textContent) => {
                  textContent.items.forEach((item) => {
                    extractedData.push({
                      str: item.str.trim(),
                      x: item.transform[4],
                      y: item.transform[5]
                    });
                  });
                });
              }));
            }

            Promise.all(pagePromises).then(() => {
              const groupedData = {};
              extractedData.forEach(item => {
                if (!groupedData[item.y]) {
                  groupedData[item.y] = [];
                }
                groupedData[item.y].push(item);
              });

              this.parsedText = '';
              Object.keys(groupedData).sort((a, b) => a - b).forEach(y => {
                groupedData[y].sort((a, b) => a.x - b.x);
                groupedData[y].forEach(item => {
                  this.parsedText += item.str + ' ';
                });
                this.parsedText += '\n';
              });

              let reformattedText = this.parsedText.replace(/\s\s+/g, ' ').trim();

              const rulePattern = new RegExp(`${this.rule.replace('{value}', '').trim()}\\s*(.+)`);
              let dueDateMatch = reformattedText.match(rulePattern);

              if (dueDateMatch) {
                this.result = dueDateMatch[1].trim().split(' ')[0];
              } else {
                this.result = 'Data tidak ditemukan.';
              }
            });
          });
        };
        reader.readAsArrayBuffer(this.file);
      }
    }
  }
});