const fs = require('fs');
const image = fs.readFileSync('./public/brasao_UFSC_JOINVILLE_impressao__vertical_sigla_color.png');
console.log('Size:', image.length);
console.log('Header:', image.slice(0, 8).toString('hex'));
