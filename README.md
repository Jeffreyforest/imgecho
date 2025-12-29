# ImgEcho - 图片信息展示与编辑工具

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Language](https://img.shields.io/badge/language-English%20%7C%20中文-blue)](README.md)
[![Web App](https://img.shields.io/badge/Web-App-green)](https://Jeffreyforest.github.io/imgecho)

一个现代化的图片信息展示与编辑工具，支持EXIF信息读取和图片元数据编辑。ImgEcho允许您在图片上叠加相机参数、拍摄信息等元数据，并支持多语言界面。

## ✨ 主要特性

### 📸 图片处理功能
- **图片上传与预览** - 支持拖放或选择文件上传
- **实时模糊效果** - 可调节模糊程度的滑块控制
- **高质量导出** - 支持导出带元数据的图片或纯信息页面

### 📝 元数据管理
- **相机信息** - 相机型号、镜头型号、ISO、光圈、快门速度
- **拍摄信息** - 拍摄地点、版权信息、自定义注释
- **EXIF支持** - 集成exif-js库读取图片EXIF信息

### 🎨 文字定制
- **字体设置** - 多种字体选择和粗细调节
- **文字大小** - 可调节的文字大小百分比
- **位置控制** - 支持左上、右上、左下、右下、中心五个位置
- **显示模式** - 完整模式（带标签）或简洁模式（仅数值）

### 🌐 多语言支持
- **双语界面** - 支持中文和英文界面切换
- **自动保存** - 用户语言偏好自动保存到本地存储
- **SEO友好** - 正确的HTML lang属性设置

### 🚀 用户体验
- **响应式设计** - 适配各种屏幕尺寸
- **实时预览** - 所有修改即时显示在画布上
- **性能优化** - 防抖处理避免频繁刷新

## 🛠️ 技术栈

- **前端框架**: 纯HTML5 + CSS3 + JavaScript (ES6+)
- **图片处理**: HTML5 Canvas API
- **EXIF读取**: exif-js库
- **样式设计**: 现代CSS Grid和Flexbox布局
- **字体图标**: Unicode Emoji图标

## 📦 快速开始

### 在线使用
直接访问 [GitHub Pages](https://yourusername.github.io/imgecho) 使用在线版本

### 本地运行
1. 克隆仓库
```bash
git clone https://github.com/yourusername/imgecho.git
cd imgecho
```

2. 启动本地服务器
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx serve .

# 或使用PHP
php -S localhost:8000
```

3. 打开浏览器访问 `http://localhost:8000`

## 📖 使用方法

### 基本操作
1. **上传图片** - 点击"上传图片"按钮或拖放图片到页面
2. **编辑元数据** - 在右侧信息面板填写相机和拍摄信息
3. **调整样式** - 设置字体、大小、位置等显示参数
4. **预览效果** - 所有修改会实时显示在左侧画布上
5. **导出结果** - 点击"导出图片"或"导出信息页"按钮

### 高级功能
- **模糊效果** - 使用滑块调节图片模糊程度
- **显示模式** - 选择"完整模式"显示标签，或"简洁模式"仅显示数值
- **多语言切换** - 右上角语言选择器切换中英文界面

## 🎯 使用场景

### 摄影爱好者
- 为作品添加专业的相机参数水印
- 创建带有拍摄信息的图片分享

### 内容创作者
- 为博客文章配图添加描述信息
- 制作带有元数据的社交媒体图片

## 🔧 项目结构

```
imgecho/
├── main.html          # 主页面文件
├── style.css          # 样式文件
├── script.js          # 主要JavaScript逻辑
├── locales.js         # 多语言资源文件
├── README.md          # 项目说明文档
└── assets/            # 资源文件目录（可选）
    └── demo/          # 演示文件
```

## 🌍 多语言支持

ImgEcho支持完整的双语界面：

- **English** - 默认语言，国际化标准
- **中文** - 完整的中文本地化

所有界面元素都支持实时语言切换，包括：
- 导航菜单和按钮文本
- 表单标签和占位符
- 画布上的元数据标签
- 导出页面的字段名

## 🚀 部署指南

### GitHub Pages部署
1. Fork本仓库到您的GitHub账户
2. 在仓库设置中启用GitHub Pages
3. 选择main分支作为发布源
4. 访问 `https://yourusername.github.io/imgecho`

### 其他平台部署
- **Netlify**: 直接拖拽项目文件夹到Netlify
- **Vercel**: 连接GitHub仓库自动部署
- **传统服务器**: 上传所有文件到Web服务器


## 🙏 致谢

- [exif-js](https://github.com/exif-js/exif-js) - EXIF信息读取库
- [Unsplash](https://unsplash.com) - 示例图片来源
- 所有贡献者和用户的支持

⭐ 如果这个项目对您有帮助，请给个Star支持一下！
