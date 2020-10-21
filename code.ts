// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'resize') {
    figma.ui.resize(Math.min(msg.width, 800), Math.min(msg.height, 400));
    return;
  } else if (msg.type === 'process') {
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  }
};

function processSelection() {
  if (figma.currentPage.selection.length !== 1) {
    figma.closePlugin('Select a single node.');
    return;
  }
  async function processNode(node) {
    if ((typeof(node) === 'undefined') || !('type' in node)) {
      figma.closePlugin('Select a node.');
      return;
    }
    switch (node.type) {
      case 'RECTANGLE':
      case 'ELLIPSE':
      case 'POLYGON':
      case 'STAR':
      case 'VECTOR':
      case 'TEXT': {
        for (const fill of node.fills) {
          if ((typeof(fill) === 'undefined') || !('type' in fill)) {
            figma.closePlugin('Select a valid node.');
            return;
          }
          if (fill.type === 'IMAGE') {
            // Paints reference images by their hash.
            const image = figma.getImageByHash(fill.imageHash)
            // Get the bytes for this image. However, the "bytes" in this
            // context refers to the bytes of file stored in PNG format. It
            // needs to be decoded into RGBA so that we can easily operate
            // on it.
            const bytes = await image.getBytesAsync()
            // This shows the HTML page in "ui.html".
            figma.showUI(__html__);
            // Send the raw bytes of the file to the worker
            figma.ui.postMessage(bytes)
            break;
          }
        }
        break;
      }

      default: {
        figma.closePlugin('Node type is not supported.');
      }
    }
  }
  processNode(figma.currentPage.selection[0]);
}

processSelection();