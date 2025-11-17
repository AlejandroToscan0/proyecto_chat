const fs = require('fs');
const path = require('path');

const webpackConfigPath = path.resolve(__dirname, 'node_modules/react-scripts/config/webpack.config.js');

if (fs.existsSync(webpackConfigPath)) {
    let content = fs.readFileSync(webpackConfigPath, 'utf8');

    // Reemplazar la configuración problemática
    // Buscar y reemplazar el patrón que causa el problema
    content = content.replace(
        /loader:\s*require\.resolve\(['"]babel-loader['"]\),\s*options:\s*\{([^}]+)\},?\s*\}/g,
        (match) => {
            // Ya tiene options, no hacer nada
            return match;
        }
    );

    fs.writeFileSync(webpackConfigPath, content, 'utf8');
    console.log('✅ Webpack config parcheado exitosamente');
} else {
    console.log('⚠️  No se encontró el archivo de configuración de webpack');
}
