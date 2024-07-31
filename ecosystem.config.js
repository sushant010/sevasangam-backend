module.exports = {
    apps: [
        {
            name: 'backend',
            script: './server.js',
            node_args: '--experimental-modules --es-module-specifier-resolution=node'
        }
    ]
};