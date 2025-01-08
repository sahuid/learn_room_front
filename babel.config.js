module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', 
      {
        useBuiltIns: 'entry',
        corejs: 3,
        targets: {
          node: 'current'
        }
      }
    ]
  ],
  plugins: [
    [
      'import',
      {
        libraryName: 'ant-design-vue',
        libraryDirectory: 'es',
        style: true
      }
    ],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }]
  ]
}
