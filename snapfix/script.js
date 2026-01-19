document.addEventListener('DOMContentLoaded', () => {
    console.log("SnapFix Script Loaded - Blizlab Theme"); 

    const fileInput = document.getElementById('fileInput');
    const wmInput = document.getElementById('wmInput');
    const gallery = document.getElementById('gallery');
    
    // UI Sections
    const controlsArea = document.getElementById('controlsArea');
    const actionArea = document.getElementById('actionArea');
    const loader = document.getElementById('loader');
    
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.getElementById('closeLightbox');

    if (!fileInput || !gallery || !downloadBtn) {
        console.error("Critical Error: HTML elements not found.");
        return;
    }

    let processedImages = []; 
    const MAX_DIMENSION = 1600; 
    const JPEG_QUALITY = 0.75; 

    // --- 1. START PROCESSING ---
    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        controlsArea.style.display = 'none'; 
        actionArea.style.display = 'none';   
        loader.style.display = 'block';      
        gallery.innerHTML = '';              
        processedImages = [];

        const wmText = wmInput ? wmInput.value.trim() : '';

        for (const file of files) {
            try {
                await processImage(file, wmText);
            } catch (err) {
                console.error("Skipping file due to error:", file.name, err);
            }
        }

        loader.style.display = 'none';
        if (processedImages.length > 0) {
            actionArea.style.display = 'flex'; 
        } else {
            alert("No images were processed successfully.");
            controlsArea.style.display = 'flex';
            fileInput.value = ''; 
        }
    });

    // --- 2. IMAGE PROCESSING LOGIC ---
    async function processImage(file, wmText) {
        const card = document.createElement('div');
        card.className = 'img-card';
        card.title = "Click to enlarge"; 
        
        const statusMsg = document.createElement('div');
        statusMsg.className = 'status';
        statusMsg.innerText = 'Queued...';
        
        gallery.appendChild(card);
        card.appendChild(statusMsg);

        try {
            let bitmap;
            
            // Strategy 1: Native
            try {
                statusMsg.innerText = 'Reading...';
                bitmap = await createImageBitmap(file);
            } catch (nativeErr) {}

            // Strategy 2: Library Fallback
            if (!bitmap) {
                const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
                
                if (isHeic) {
                    statusMsg.innerText = 'Converting...';
                    if (typeof heic2any === 'undefined') throw new Error("Converter library missing.");

                    try {
                        const conversionResult = await heic2any({ 
                            blob: file, 
                            toType: "image/jpeg", 
                            quality: 0.8,
                            multiple: true 
                        });
                        const blobToLoad = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                        bitmap = await createImageBitmap(blobToLoad);
                    } catch (libErr) {
                        throw new Error("BROWSER_UNSUPPORTED");
                    }
                } else {
                    throw new Error("File corrupt or unknown format.");
                }
            }

            // Resize
            let width = bitmap.width;
            let height = bitmap.height;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0, width, height);

            // Pixels
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            let totalR = 0, totalG = 0, totalB = 0;

            for (let i = 0; i < data.length; i += 4) {
                totalR += data[i]; totalG += data[i+1]; totalB += data[i+2];
            }

            const numPixels = data.length / 4;
            const avgGray = ((totalR/numPixels) + (totalG/numPixels) + (totalB/numPixels)) / 3;
            const scaleR = avgGray / (totalR/numPixels) || 1;
            const scaleG = avgGray / (totalG/numPixels) || 1;
            const scaleB = avgGray / (totalB/numPixels) || 1;
            const brightnessOffset = avgGray < 100 ? (110 - avgGray) : 0; 

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i] * scaleR + brightnessOffset;
                let g = data[i+1] * scaleG + brightnessOffset;
                let b = data[i+2] * scaleB + brightnessOffset;
                data[i] = ((r - 128) * 1.1) + 128;
                data[i+1] = ((g - 128) * 1.1) + 128;
                data[i+2] = ((b - 128) * 1.1) + 128;
            }
            ctx.putImageData(imageData, 0, 0);

            // Watermark
            if (wmText) {
                const fontSize = Math.floor(width * 0.035); 
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                const padding = fontSize; 
                ctx.globalAlpha = 0.6; ctx.fillStyle = 'black';
                ctx.fillText(wmText, width - padding + 2, height - padding + 2);
                ctx.globalAlpha = 0.4; ctx.fillStyle = 'white';
                ctx.fillText(wmText, width - padding, height - padding);
            }

            // Finalize
            statusMsg.innerText = 'Optimized';
            statusMsg.style.color = '#0099CC'; 
            card.insertBefore(canvas, statusMsg);

            canvas.toBlob((blob) => {
                if (!blob) throw new Error("Save error");
                
                processedImages.push({
                    name: file.name.replace(/\.[^/.]+$/, "") + "_web.jpg",
                    blob: blob
                });

                card.addEventListener('click', () => {
                    const url = URL.createObjectURL(blob);
                    lightboxImg.src = url;
                    lightbox.style.display = "flex";
                });

            }, 'image/jpeg', JPEG_QUALITY);

        } catch (err) {
            console.error(err);
            statusMsg.innerText = "Failed";
            statusMsg.style.color = '#c03221'; 
            
            // --- UPDATED ERROR LOGIC: Include File Name ---
            const errorDetail = document.createElement('div');
            errorDetail.style.fontSize = '0.75em';
            errorDetail.style.marginTop = '4px';
            errorDetail.style.lineHeight = '1.2';
            errorDetail.style.wordBreak = 'break-word';
            
            // Bold the filename for clarity
            const fileNameBold = `<b>${file.name}</b>`;
            
            if (err.message === "BROWSER_UNSUPPORTED") {
                 errorDetail.innerHTML = `${fileNameBold} requires Safari on this device.`;
            } else {
                 errorDetail.innerHTML = `${fileNameBold}: ${err.message}`;
            }
            
            card.appendChild(errorDetail);
        }
    }

    // --- 3. ACTIONS ---
    downloadBtn.addEventListener('click', () => {
        if(typeof JSZip === 'undefined') { alert("JSZip library not loaded."); return; }
        const zip = new JSZip();
        processedImages.forEach(img => zip.file(img.name, img.blob));
        const originalText = downloadBtn.innerText;
        downloadBtn.innerText = "Zipping...";
        zip.generateAsync({type:"blob"}).then((content) => {
            saveAs(content, "SnapFix_Web_Ready.zip");
            downloadBtn.innerText = originalText;
        });
    });

    resetBtn.addEventListener('click', () => {
        processedImages = [];
        gallery.innerHTML = '';
        fileInput.value = ''; 
        controlsArea.style.display = 'flex'; 
        actionArea.style.display = 'none';   
    });

    closeLightbox.addEventListener('click', () => {
        lightbox.style.display = "none";
        lightboxImg.src = ""; 
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
            lightboxImg.src = "";
        }
    });
});