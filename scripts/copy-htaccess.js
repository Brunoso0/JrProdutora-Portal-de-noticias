const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'htaccess-template.txt');
const dest = path.join(__dirname, '..', 'build', '.htaccess');

fs.copyFile(src, dest, (err) => {
  if (err) return console.error("Erro ao copiar .htaccess:", err);
  console.log(".htaccess copiado com sucesso após build.");
});
// forcar o build do app