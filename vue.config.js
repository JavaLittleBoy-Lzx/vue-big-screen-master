module.exports = {
  transpileDependencies: [],
  
  // 开发服务器配置
  devServer: {
    port: 6954,
    host: 'localhost',
    open: true,
    // 禁用主机检查，允许外部访问
    disableHostCheck: true,
    // 禁用各种日志输出
    clientLogLevel: 'silent',
    noInfo: true,
    quiet: false, // 设为false以显示编译错误，但不显示代理日志
    stats: 'errors-only', // 只显示错误
    
    // 代理配置，解决CORS问题
    proxy: {
      // 代理所有以 /api 开头的请求到本地后端
      '/api': {
        target: 'http://localhost:8675', // 后端服务地址
        //  target: 'http://www.xuerparking.cn:8675', // 后端服务地址
        changeOrigin: true,
        secure: false,
        logLevel: 'silent', // 完全禁用日志
        // 路径重写，将/api前缀去掉
        pathRewrite: {
          '^/api': ''
        },
        // 完全静默模式
        onProxyReq: () => {},
        onProxyRes: () => {},
        onError: () => {}
      },
      // 代理违规管理API到外部服务器
      '/violation-api': {
        target: 'https://www.xuerparking.cn:8543', // 违规管理服务地址
        changeOrigin: true,
        secure: false, // 如果是https且证书有问题，设置为false
        logLevel: 'silent', // 禁用日志输出
        // 路径重写
        pathRewrite: {
          '^/violation-api': ''
        },
        // 添加超时设置
        timeout: 30000,
        // 静默模式 - 不输出任何日志
        onProxyReq: () => {},
        onProxyRes: () => {},
        onError: () => {}
      }
    },
    
    // 添加CORS头
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    
    // 禁用热重载的某些功能，减少CORS冲突
    hot: true,
    liveReload: true
  },
  
  // 构建配置
  configureWebpack: {
    // 添加CORS相关的webpack配置
    devtool: 'source-map',
    
    // 优化配置
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          echarts: {
            name: 'chunk-echarts',
            test: /[\\/]node_modules[\\/]echarts[\\/]/,
            priority: 20,
            chunks: 'all'
          }
        }
      }
    }
  },
  
  // CSS配置
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: false,
    loaderOptions: {
      sass: {
        prependData: `@import "@/assets/scss/_variables.scss";`
      }
    }
  },
  
  // 生产环境配置
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  
  // 禁用eslint检查（可选）
  lintOnSave: false
}
