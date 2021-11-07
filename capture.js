function prepareFile(file, zip, container) {
  //Step 2: Read the file using file reader
  var fileReader = new FileReader();

  fileReader.onload = function () {
    //Step 4:turn array buffer into typed array
    var typedarray = new Uint8Array(this.result);

    renderPDF(typedarray, container, zip, file.name);
  };
  //Step 3:Read the file as ArrayBuffer
  fileReader.readAsArrayBuffer(file);
}

function renderPDF(typedarray, canvasContainer, zip, url) {
  function renderPage(page, pageNum) {
    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");
    viewport = page.getViewport({ scale: 3 });

    const rembrandt = new FindBox({
      imageA: new FindBox.Image(ctx),

      maxDelta: 0.00000001,

      targetColors: [
        { r: 255 / 255, g: 238 / 255, b: 228 / 255, a: 255 / 255 },
        { r: 247 / 255, g: 237 / 255, b: 237 / 255, a: 255 / 255 },
        { r: 187 / 255, g: 90 / 255, b: 106 / 255, a: 255 / 255 },
      ],
    });

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = "100%";

    canvas.style.transform = "scale(1,1)";
    canvas.style.transformOrigin = "0% 0%";

    const canvasWrapper = document.createElement("div");

    canvasWrapper.style.width = "100%";
    canvasWrapper.style.height = "100%";

    canvasWrapper.appendChild(canvas);

    const renderContext = {
      canvasContext: ctx,
      viewport,
    };

    canvasContainer.appendChild(canvasWrapper);

    page.render(renderContext).promise.then(function () {
      // Run the comparison
      rembrandt.compare().then(function (result) {
        console.log("Page: " + pageNum);
        console.log("Passed:", result.passed);
        console.log(
          "Pixel Difference:",
          result.differences,
          "Percentage Difference",
          result.percentageDifference,
          "%"
        );
        console.log("boxes:", result.boxes);

        result.boxes.forEach((a, b) =>
          saveSnap(a, b, pageNum, zip, url, canvas)
        );
        window.numberfinished++;
      });
    });
  }

  function renderPages(pdfDoc) {
    window.numberfinished -= pdfDoc.numPages;
    for (let num = 1; num <= pdfDoc.numPages; num += 1)
      pdfDoc.getPage(num).then(renderPage);
  }

  pdfjsLib.disableWorker = true;
  pdfjsLib.getDocument(typedarray).promise.then(renderPages);
}

function saveSnap(box, i, pageNum, zip, url, canvas) {
  var hidden_canv = document.createElement("canvas");
  hidden_canv.style.display = "none";
  document.body.appendChild(hidden_canv);
  hidden_canv.width = box.finish.x - box.start.x;
  hidden_canv.height = box.finish.y - box.start.y;

  //Draw the data you want to download to the hidden canvas
  var hidden_ctx = hidden_canv.getContext("2d");
  hidden_ctx.drawImage(
    canvas,
    box.start.x, //Start Clipping
    box.start.y, //Start Clipping
    box.finish.x - box.start.x, //Clipping Width
    box.finish.y - box.start.y, //Clipping Height
    0, //Place X
    0, //Place Y
    box.finish.x - box.start.x, //Place Width
    box.finish.y - box.start.y //Place Height
  );

  var savable = new Image();
  savable.src = hidden_canv.toDataURL();
  zip.file(
    "Document: " + url + " - Page " + pageNum + " - Image " + i + ".png",
    savable.src.substr(savable.src.indexOf(",") + 1),
    { base64: true }
  );
  hidden_canv.parentNode.removeChild(hidden_canv);
}
