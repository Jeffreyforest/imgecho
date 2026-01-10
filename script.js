// ===== 全局状态管理 =====
const appState = {
    currentImage: null,           // 当前图片数据URL
    originalImage: null,          // 原始图片对象
    canvas: document.getElementById('image-canvas'), // 画布元素
    ctx: null,                    // 画布上下文
    needsRefresh: true,           // 是否需要刷新画布
    refreshTimeout: null,         // 刷新定时器
    currentLanguage: 'zh-CN'      // 当前语言设置
};

// ===== 应用初始化函数 =====

/**
 * 初始化应用
 * 设置画布上下文、事件监听器，并加载示例图片
 */
function initializeApp() {
    appState.ctx = appState.canvas.getContext('2d');
    setupEventListeners();
    
    // 初始化语言管理器后更新界面
    if (typeof languageManager !== 'undefined') {
        languageManager.updateUI();
    }
    
    loadSampleImage();
}

/**
 * 设置所有事件监听器
 * 包括文件上传、滑块控制、输入字段变化等
 */
function setupEventListeners() {
    // 文件上传事件
    document.getElementById('file-input').addEventListener('change', handleImageUpload);
    
    // 模糊效果滑块事件
    const blurSlider = document.getElementById('blur-slider');
    blurSlider.addEventListener('input', handleBlurChange);
    blurSlider.addEventListener('change', handleBlurChange);
    
    // 字体大小滑块事件
    document.getElementById('font-size').addEventListener('input', function(e) {
        const fontSizePercent = parseFloat(e.target.value);
        document.getElementById('font-size-value').textContent = fontSizePercent.toFixed(1);
        scheduleRefresh();
    });
    
    // 所有输入字段的实时刷新事件
    const inputFields = ['camera', 'lens', 'location', 'iso', 'aperture', 'shutter', 'notes', 'copyright', 'font-family', 'font-weight', 'font-size', 'font-position', 'display-mode'];
    inputFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', scheduleRefresh);
            if (element.tagName === 'SELECT') {
                element.addEventListener('change', scheduleRefresh);
            }
        }
    });
    
    // 语言切换事件
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function(e) {
            const selectedLanguage = e.target.value;
            languageManager.setLanguage(selectedLanguage);
        });
        
        // 设置当前选中的语言
        languageSelect.value = languageManager.currentLanguage;
    }
    
    // 导出按钮事件
    document.getElementById('export-btn').addEventListener('click', exportImageWithCanvas);
    
    // 导出信息页按钮事件
    document.getElementById('export-info-btn').addEventListener('click', exportInfoPage);
}

// ===== 图片处理函数 =====

/**
 * 加载示例图片
 * 使用Unsplash的示例图片进行演示
 */
function loadSampleImage() {
    const sampleImage = new Image();
    sampleImage.crossOrigin = 'anonymous';
    sampleImage.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    
    sampleImage.onload = function() {
        appState.originalImage = sampleImage;
        displayImageOnCanvas(sampleImage);
        
        // 设置默认元数据
        setDefaultMetadata();
        scheduleRefresh();
    };
}

/**
 * 设置默认元数据
 * 为示例图片提供默认的相机信息
 */
function setDefaultMetadata() {
    document.getElementById('camera').value = 'Canon EOS R5';
    document.getElementById('lens').value = 'EF 24-70mm f/2.8L II USM';
    document.getElementById('location').value = languageManager.get('defaultLocation');
    document.getElementById('iso').value = '100';
    document.getElementById('aperture').value = 'f/8';
    document.getElementById('shutter').value = '1/125s';
    document.getElementById('notes').value = languageManager.get('defaultNotes');
    document.getElementById('copyright').value = languageManager.get('defaultCopyright');
}

/**
 * 处理图片上传
 * @param {Event} e - 文件上传事件
 */
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        appState.currentImage = event.target.result;
        const img = new Image();
        img.onload = function() {
            appState.originalImage = img;
            displayImageOnCanvas(img);
            
            // 读取EXIF数据
            readExifData(file);
        };
        img.src = appState.currentImage;
    };
    reader.readAsDataURL(file);
}

/**
 * 读取图片的EXIF数据
 * @param {File} file - 图片文件
 */
function readExifData(file) {
    console.log('开始读取EXIF数据...');
    
    // 检查EXIF库是否可用
    if (typeof EXIF === 'undefined') {
        console.error('EXIF库未正确加载！');
        alert('EXIF库加载失败，请检查网络连接或刷新页面');
        return;
    }
    
    EXIF.getData(file, function() {
        const exifData = this;
        console.log('EXIF数据对象:', exifData);
        
        // 调试：打印所有可用的EXIF标签
        console.log('所有EXIF标签:', Object.keys(exifData.exifdata || {}));
        
        // 提取常用EXIF信息并填充到表单
        const cameraModel = EXIF.getTag(exifData, 'Model') || EXIF.getTag(exifData, 'CameraModelName') || '';
        const lensModel = EXIF.getTag(exifData, 'LensModel') || EXIF.getTag(exifData, 'LensType') || EXIF.getTag(exifData, 'LensInfo') || '';
        
        console.log('相机型号:', cameraModel);
        console.log('镜头型号:', lensModel);
        
        document.getElementById('camera').value = cameraModel;
        document.getElementById('lens').value = lensModel;
        
        // 提取GPS和地点信息
        const locationInfo = extractLocationInfo(exifData);
        console.log('地点信息:', locationInfo);
        document.getElementById('location').value = locationInfo;
        
        // 提取其他EXIF信息
        const isoValue = EXIF.getTag(exifData, 'ISOSpeedRatings') || EXIF.getTag(exifData, 'ISO') || '';
        const apertureValue = EXIF.getTag(exifData, 'FNumber') || '';
        const shutterValue = EXIF.getTag(exifData, 'ExposureTime') || '';
        
        console.log('ISO:', isoValue);
        console.log('光圈:', apertureValue);
        console.log('快门:', shutterValue);
        
        document.getElementById('iso').value = isoValue;
        document.getElementById('aperture').value = apertureValue ? `f/${apertureValue}` : '';
        document.getElementById('shutter').value = shutterValue ? formatExposureTime(shutterValue) : '';
        
        // 清空其他字段
        document.getElementById('notes').value = '';
        document.getElementById('copyright').value = '';
        
        console.log('EXIF数据读取完成');
        scheduleRefresh();
    });
}

/**
 * 提取地点信息
 * @param {Object} exifData - EXIF数据对象
 * @returns {string} 地点信息字符串
 */
function extractLocationInfo(exifData) {
    let locationInfo = '';
    
    // 1. 尝试提取GPS坐标
    const gpsInfo = extractGPSInfo(exifData);
    if (gpsInfo) {
        locationInfo = gpsInfo;
    }
    
    // 2. 尝试提取城市/地区信息
    const city = EXIF.getTag(exifData, 'City') || EXIF.getTag(exifData, 'Sub-location') || '';
    const state = EXIF.getTag(exifData, 'State') || EXIF.getTag(exifData, 'Province-State') || '';
    const country = EXIF.getTag(exifData, 'Country') || EXIF.getTag(exifData, 'Country-PrimaryLocationName') || '';
    
    if (city || state || country) {
        const locationParts = [city, state, country].filter(Boolean);
        if (locationParts.length > 0) {
            if (locationInfo) {
                locationInfo += ' | ';
            }
            locationInfo += locationParts.join(', ');
        }
    }
    
    // 3. 如果没有任何地点信息，返回空字符串
    return locationInfo || '';
}

/**
 * 提取GPS坐标信息
 * @param {Object} exifData - EXIF数据对象
 * @returns {string} GPS坐标字符串
 */
function extractGPSInfo(exifData) {
    try {
        const gpsLatitude = EXIF.getTag(exifData, 'GPSLatitude');
        const gpsLongitude = EXIF.getTag(exifData, 'GPSLongitude');
        const gpsLatitudeRef = EXIF.getTag(exifData, 'GPSLatitudeRef') || 'N';
        const gpsLongitudeRef = EXIF.getTag(exifData, 'GPSLongitudeRef') || 'E';
        
        if (gpsLatitude && gpsLongitude) {
            // 将度分秒格式转换为十进制
            const lat = convertDMSToDD(gpsLatitude, gpsLatitudeRef);
            const lng = convertDMSToDD(gpsLongitude, gpsLongitudeRef);
            
            if (lat !== null && lng !== null) {
                return `${lat.toFixed(6)}°${gpsLatitudeRef}, ${lng.toFixed(6)}°${gpsLongitudeRef}`;
            }
        }
    } catch (error) {
        console.warn('GPS坐标提取失败:', error);
    }
    
    return '';
}

/**
 * 将度分秒格式转换为十进制
 * @param {Array} dmsArray - 度分秒数组 [度, 分, 秒]
 * @param {string} ref - 方向参考 (N/S/E/W)
 * @returns {number|null} 十进制坐标
 */
function convertDMSToDD(dmsArray, ref) {
    if (!Array.isArray(dmsArray) || dmsArray.length < 3) {
        return null;
    }
    
    try {
        const degrees = dmsArray[0];
        const minutes = dmsArray[1];
        const seconds = dmsArray[2];
        
        // 确保所有值都是数字
        const deg = typeof degrees === 'number' ? degrees : parseFloat(degrees);
        const min = typeof minutes === 'number' ? minutes : parseFloat(minutes);
        const sec = typeof seconds === 'number' ? seconds : parseFloat(seconds);
        
        if (isNaN(deg) || isNaN(min) || isNaN(sec)) {
            return null;
        }
        
        // 计算十进制坐标
        let dd = deg + (min / 60) + (sec / 3600);
        
        // 根据方向参考调整正负
        if (ref === 'S' || ref === 'W') {
            dd = -dd;
        }
        
        return dd;
    } catch (error) {
        console.warn('坐标转换失败:', error);
        return null;
    }
}

/**
 * 格式化曝光时间
 * @param {number} time - 曝光时间
 * @returns {string} 格式化后的曝光时间
 */
function formatExposureTime(time) {
    if (time >= 1) {
        return `${time}s`;
    } else {
        const denominator = Math.round(1 / time);
        return `1/${denominator}s`;
    }
}

// ===== 控件处理函数 =====

/**
 * 处理模糊效果变化
 * @param {Event} e - 滑块变化事件
 */
function handleBlurChange(e) {
    const blurValue = Math.max(0, Math.min(10, parseFloat(e.target.value)));
    document.getElementById('blur-value').textContent = blurValue.toFixed(1);
    scheduleRefresh();
}

/**
 * 刷新调度函数 - 防抖处理
 * 优化性能，避免频繁刷新
 */
function scheduleRefresh() {
    appState.needsRefresh = true;
    
    // 清除之前的定时器
    if (appState.refreshTimeout) {
        clearTimeout(appState.refreshTimeout);
    }
    
    // 设置新的定时器，延迟50ms以优化性能
    appState.refreshTimeout = setTimeout(() => {
        if (appState.needsRefresh && appState.originalImage) {
            refreshCanvas();
            appState.needsRefresh = false;
        }
    }, 50);
}

/**
 * 刷新画布内容
 */
function refreshCanvas() {
    if (appState.originalImage) {
        displayImageOnCanvas(appState.originalImage);
        updateMetadataOverlay();
    }
}

// ===== 画布操作函数 =====

/**
 * 在画布上显示图片
 * @param {Image} img - 要显示的图片对象
 */
function displayImageOnCanvas(img) {
    // 设置canvas尺寸为图片原始尺寸
    appState.canvas.width = img.naturalWidth;
    appState.canvas.height = img.naturalHeight;
    
    // 计算显示比例
    const maxDisplayWidth = appState.canvas.parentElement.clientWidth - 40;
    const maxDisplayHeight = 500;
    const scale = Math.min(maxDisplayWidth / appState.canvas.width, maxDisplayHeight / appState.canvas.height, 1);
    
    // 设置canvas CSS显示尺寸
    appState.canvas.style.width = `${appState.canvas.width * scale}px`;
    appState.canvas.style.height = `${appState.canvas.height * scale}px`;
    
    // 绘制图片
    appState.ctx.clearRect(0, 0, appState.canvas.width, appState.canvas.height);
    appState.ctx.filter = `blur(${document.getElementById('blur-slider').value * 2}px)`;
    appState.ctx.drawImage(img, 0, 0, appState.canvas.width, appState.canvas.height);
    
    // 重置所有滤镜和样式，确保文字清晰
    appState.ctx.filter = 'none';
    appState.ctx.globalAlpha = 1;
    appState.ctx.shadowBlur = 0;
    appState.ctx.save();
}

/**
 * 更新元数据覆盖层
 * @param {CanvasRenderingContext2D} overrideCtx - 可选的画布上下文（用于导出）
 */
function updateMetadataOverlay(overrideCtx) {
    const ctx = overrideCtx || appState.ctx;
    
    // 先清除画布，重新绘制图片
    if (appState.originalImage) {
        ctx.clearRect(0, 0, appState.canvas.width, appState.canvas.height);
        ctx.save();
        ctx.filter = `blur(${document.getElementById('blur-slider').value * 2}px)`;
        ctx.drawImage(appState.originalImage, 0, 0, appState.canvas.width, appState.canvas.height);
        ctx.restore();
    }
    
    // 获取字体设置
    const fontFamily = document.getElementById('font-family').value;
    const fontWeight = document.getElementById('font-weight').value;
    const fontSizePercent = parseFloat(document.getElementById('font-size').value);
    const fontSize = Math.max(12, (appState.canvas.height * fontSizePercent) / 100);
    const lineHeight = fontSize * 1.8;
    
    // 设置文字样式
    const fontStyle = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.font = fontStyle;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // 设置阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // 收集所有元数据字段
    const metadata = {
        [languageManager.get('camera')]: document.getElementById('camera').value,
        [languageManager.get('lens')]: document.getElementById('lens').value,
        [languageManager.get('location')]: document.getElementById('location').value,
        [languageManager.get('iso')]: document.getElementById('iso').value,
        [languageManager.get('aperture')]: document.getElementById('aperture').value,
        [languageManager.get('shutter')]: document.getElementById('shutter').value,
        [languageManager.get('copyright')]: document.getElementById('copyright').value
    };
    
    // 单独处理注释
    const notes = document.getElementById('notes').value;
    
    // 获取显示模式
    const displayMode = document.getElementById('display-mode').value;
    
    // 构建文本内容
    let textLines = buildTextLines(metadata, notes, displayMode);
    
    // 如果没有内容需要显示，直接返回
    if (textLines.length === 0) return;
    
    // 绘制文本
    drawTextLines(ctx, textLines, fontSize, lineHeight);
}

/**
 * 构建文本行数组
 * @param {Object} metadata - 元数据对象
 * @param {string} notes - 注释文本
 * @param {string} displayMode - 显示模式
 * @returns {Array} 文本行数组
 */
function buildTextLines(metadata, notes, displayMode) {
    let textLines = [];
    
    // 添加元数据行
    Object.entries(metadata).forEach(([key, value]) => {
        if (value.trim()) {
            if (displayMode === 'full') {
                textLines.push(`${key}: ${value}`);
            } else {
                textLines.push(value);
            }
        }
    });
    
    // 添加注释内容
    if (notes.trim()) {
        if (textLines.length > 0) {
            textLines.push('─'.repeat(15));
        }
        textLines.push(...notes.trim().split('\n'));
    }
    
    return textLines;
}

/**
 * 绘制文本行
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {Array} textLines - 文本行数组
 * @param {number} fontSize - 字体大小
 * @param {number} lineHeight - 行高
 */
function drawTextLines(ctx, textLines, fontSize, lineHeight) {
    // 获取字体位置
    const fontPosition = document.getElementById('font-position').value;
    
    // 计算文本位置和布局
    const margin = Math.max(25, fontSize * 1.2);
    
    // 计算文本块的总高度和最大宽度
    let maxLineWidth = 0;
    textLines.forEach(line => {
        const lineWidth = ctx.measureText(line).width;
        maxLineWidth = Math.max(maxLineWidth, lineWidth);
    });
    
    const totalTextHeight = textLines.length * lineHeight;
    
    // 根据位置计算起始坐标
    const { startX, startY } = calculateTextPosition(fontPosition, margin, maxLineWidth, totalTextHeight);
    
    // 确保文本绘制不受任何滤镜影响
    ctx.save();
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    
    // 绘制文本
    ctx.fillStyle = 'white';
    textLines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        const x = startX;
        ctx.fillText(line, x, y);
    });
    
    ctx.restore();
}

/**
 * 计算文本位置
 * @param {string} fontPosition - 字体位置
 * @param {number} margin - 边距
 * @param {number} maxLineWidth - 最大行宽
 * @param {number} totalTextHeight - 总文本高度
 * @returns {Object} 起始坐标对象
 */
function calculateTextPosition(fontPosition, margin, maxLineWidth, totalTextHeight) {
    let startX, startY;
    
    switch (fontPosition) {
        case 'top-left':
            startX = margin;
            startY = margin;
            break;
        case 'top-right':
            startX = appState.canvas.width - margin - maxLineWidth;
            startY = margin;
            break;
        case 'bottom-left':
            startX = margin;
            startY = appState.canvas.height - margin - totalTextHeight;
            break;
        case 'bottom-right':
            startX = appState.canvas.width - margin - maxLineWidth;
            startY = appState.canvas.height - margin - totalTextHeight;
            break;
        case 'center':
            startX = (appState.canvas.width - maxLineWidth) / 2;
            startY = (appState.canvas.height - totalTextHeight) / 2;
            break;
        default:
            startX = margin;
            startY = margin;
    }
    
    return { startX, startY };
}

// ===== 导出功能 =====

/**
 * 导出图片函数（仅Canvas方式）
 */
function exportImageWithCanvas() {
    if (!appState.originalImage) {
        alert('请先上传图片！');
        return;
    }
    
    exportWithCanvas();
}

/**
 * 导出信息页函数
 */
function exportInfoPage() {
    if (!appState.originalImage) {
        alert('请先上传图片！');
        return;
    }
    
    exportWithoutCanvas();
}

/**
 * 使用Canvas导出（原有方式）
 */
async function exportWithCanvas() {
    // 确保画布已完成渲染
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // 创建新画布专门用于导出
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = appState.canvas.width;
    exportCanvas.height = appState.canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // 重新绘制所有内容
    exportCtx.drawImage(appState.originalImage, 0, 0);
    updateMetadataOverlay(exportCtx);
    
    // 等待一帧确保绘制完成
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // 创建下载链接
    exportCanvas.toBlob(blob => {
        if (!blob) {
            throw new Error('无法创建图片数据');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `photo_${Date.now()}.jpg`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/jpeg', 0.95);
}

/**
 * 不使用Canvas的标准导出方式
 * 兼容性更好，Windows不会拦截
 */
async function exportWithoutCanvas() {
    if (!appState.originalImage) {
        throw new Error('没有可用的图片数据');
    }
    
    // 创建新的图片对象
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // 等待图片加载完成
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = appState.originalImage.src;
    });
    
    // 创建包含元数据的HTML文档
    const htmlContent = createImageWithMetadataHTML(img);
    
    // 创建Blob对象
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = `photo_${Date.now()}.html`;
    link.click();
    
    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
}

/**
 * 创建包含图片和元数据的HTML文档
 * @param {Image} img - 图片对象
 * @returns {string} HTML内容
 */
function createImageWithMetadataHTML(img) {
    const metadata = getCurrentMetadata();
    const timestamp = new Date().toLocaleString('zh-CN');
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图片信息 - ${timestamp}</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        .image-section {
            text-align: center;
            margin-bottom: 20px;
        }
        .image-section img {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .metadata-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        .metadata-section h3 {
            margin-top: 0;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        .metadata-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .metadata-label {
            font-weight: bold;
            color: #4a5568;
        }
        .metadata-value {
            color: #2d3748;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #718096;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="image-section">
            <img src="${img.src}" alt="导出图片">
        </div>
        
        <div class="metadata-section">
            <h3>📸 图片信息</h3>
            <div class="metadata-grid">
                ${Object.entries(metadata).map(([key, value]) => 
                    value ? `<div class="metadata-item">
                        <span class="metadata-label">${key}</span>
                        <span class="metadata-value">${value}</span>
                    </div>` : ''
                ).filter(Boolean).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>导出时间: ${timestamp} | 使用 ImgEcho 工具生成</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * 获取当前所有元数据
 * @returns {Object} 元数据对象
 */
function getCurrentMetadata() {
    return {
        [languageManager.get('camera')]: document.getElementById('camera').value,
        [languageManager.get('lens')]: document.getElementById('lens').value,
        [languageManager.get('location')]: document.getElementById('location').value,
        [languageManager.get('iso')]: document.getElementById('iso').value,
        [languageManager.get('aperture')]: document.getElementById('aperture').value,
        [languageManager.get('shutter')]: document.getElementById('shutter').value,
        [languageManager.get('copyright')]: document.getElementById('copyright').value,
        [languageManager.get('notes')]: document.getElementById('notes').value
    };
}

// ===== 页面加载事件 =====

// 页面加载时初始化应用
window.addEventListener('load', initializeApp);