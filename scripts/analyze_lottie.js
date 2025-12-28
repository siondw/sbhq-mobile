const fs = require('fs');

const fileName = 'assets/gifs/football.json';

try {
  const data = fs.readFileSync(fileName, 'utf8');
  const lottie = JSON.parse(data);
  const targetRed = [0.8353,0.1647,0.1922];
  const targetDarkRed = [0.4157,0.0824,0.0941];

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < 3; ++i) { 
      if (Math.abs(a[i] - b[i]) > 0.001) return false;
    }
    return true;
  }

  function traverseLayers(layers, prefix = '') {
    layers.forEach(layer => {
      const currentPath = prefix ? `${prefix}.${layer.nm}` : layer.nm;
      
      if (layer.shapes) {
         traverseShapes(layer.shapes, currentPath);
      }
      if (layer.refId) {
          const asset = lottie.assets.find(a => a.id === layer.refId);
          if (asset && asset.layers) {
              traverseLayers(asset.layers, currentPath);
          }
      }
    });
  }
  
  function traverseShapes(items, prefix = '') {
      items.forEach(item => {
           const currentPath = prefix ? `${prefix}.${item.nm}` : item.nm;
           
           if (item.it) {
               traverseShapes(item.it, currentPath);
           }
           if (item.ty === 'fl' || item.ty === 'st') {
                const color = item.c.k;
                if (Array.isArray(color)) {
                    if (arraysEqual(color, targetRed)) {
                        console.log(`Keypath: "${currentPath}", // Red`);
                    } else if (arraysEqual(color, targetDarkRed)) {
                        console.log(`Keypath: "${currentPath}", // Dark Red`);
                    }
                }
           }
      });
  }

  console.log('Matching Keypaths:');
  traverseLayers(lottie.layers);

} catch (err) {
  console.error(err);
}
