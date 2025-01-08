const { defineConfig } = require('@vue/cli-service')
const defineOptions = require('unplugin-vue-define-options/webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        // pathRewrite: {
        //   '^/api': ''  // 如果后端接口没有 /api 前缀，则需要重写路径
        // }
      }
    }
  },
  configureWebpack: {
    plugins: [
      defineOptions()
    ]
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    },
  },
})
