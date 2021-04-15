let operations = `[]`;
let mainCanvas = document.getElementById("canvas");
let preimg = document.getElementById("base-image-pre");
let mainCtx = mainCanvas.getContext("2d");
let max_aspect_ratio,
  max_height,
  max_width = 1;
let save_pending = false;
let state = {
  multiplier: 1,
  newbase: false,
  newPosition: false,
  activeElem: null,
  x: 0,
  y: 0,
  updatetimer: null,
  temp: 0,
};

async function getop() {
  await $.get("/api/database/2/abcd", async (data) => {
    // console.log(data[0].temp.operations);
    operations = await data.temp.operations;
  });
}

getop().then(() => {
  $("document").ready(async function () {
    $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
    mainCanvas.style.marginTop = "15px";
    max_height = window.innerHeight - 115;
    max_width = window.innerWidth - 384;
    max_aspect_ratio = max_width / max_height;
    console.log("Max aspect ratio: ", max_aspect_ratio);
    document.getElementById("right").style.width = max_width + "px";
    loadFromJson();
  });

  mainCanvas.onmousemove = function (event) {
    // console.log('img hover')
    // console.log(event)
    let x =
      event.offsetX >= 0 ? Math.round(event.offsetX * state.multiplier) : 0;
    let y =
      event.offsetY > -0 ? Math.round(event.offsetY * state.multiplier) : 0;
    document.getElementById("mouse-pos").innerText =
      x + ", " + (preimg.naturalHeight - y);
    if (state.newPosition) {
      state.x = x;
      state.y = preimg.naturalHeight - y;
    }
  };

  mainCanvas.onclick = function (event) {
    if (state.newPosition) {
      state.newPosition = false;
      mainCanvas.style.cursor = "default";
      state.x =
        event.offsetX >= 0 ? Math.round(event.offsetX * state.multiplier) : 0;
      state.y =
        event.offsetY > -0
          ? preimg.naturalHeight - Math.round(event.offsetY * state.multiplier)
          : 0;
      document[state.activeElem].x.value = state.x;
      document[state.activeElem].y.value = state.y;
      operations[state.activeElem].x = state.x; // document[state.activeElem].x.value
      operations[state.activeElem].y = state.y; // document[state.activeElem].y.value
      clearInterval(state.updatetimer);
      state.updatetimer = null;
      updateRender();
      document.getElementById("user-msg").innerText =
        "Add or Edit, Text and Image elements ";
      document.getElementById("current-process").innerText = "ready";
    }
  };

  document.getElementById("base-image-pre").onload = function () {
    // here this refers to img tag which have template of certificate
    // console.log(this.src);
    document.getElementById("doc-size").innerText =
      this.naturalWidth + ", " + this.naturalHeight;
    let aspect_ratio = this.naturalWidth / this.naturalHeight;
    // this.crossOrigin="anonymous"
    mainCanvas.width = this.naturalWidth;
    mainCanvas.height = this.naturalHeight;
    mainCtx.drawImage(this, 0, 0);
    let main_canvas_height = 0;
    if (aspect_ratio < max_aspect_ratio) {
      main_canvas_height = max_height;
      mainCanvas.style.height = main_canvas_height + "px";
      mainCanvas.style.width = max_height * aspect_ratio + "px";
    } else {
      mainCanvas.style.width = max_width + "px";
      main_canvas_height = max_width / aspect_ratio;
      mainCanvas.style.height = main_canvas_height + "px";
    }
    state.multiplier = this.naturalHeight / main_canvas_height;
    state.x = max_width / 2;
    state.y = max_height / 2;
    if (state.newbase) {
      document.getElementById("user-msg").innerText = "Add a Text or Image";
      let baseobj = {};
      baseobj.src = this.src;
      baseobj.w = this.naturalWidth;
      baseobj.h = this.naturalHeight;
      if (typeof state.temp == "object") baseobj.file = state.temp;
      operations.splice(0, 1, baseobj);
    }
    state.newbase = false;
    document.getElementById("current-process").innerText = "Ready";
    if (operations.length == 0)
      document.getElementById("user-msg").innerText = "Select a Base Image";
    updateRender();
  };

  function updateRender() {
    // console.log("Main render")
    mainCtx.drawImage(preimg, 0, 0);
    for (let i = 1; i < operations.length; i++) {
      if (operations[i].type == "text") {
        mainCtx.font =
          operations[i].style +
          " " +
          operations[i].size +
          "px " +
          operations[i].font;
        mainCtx.fillStyle = operations[i].color;
        mainCtx.textAlign = operations[i].align;
        mainCtx.fillText(
          operations[i].value,
          operations[i].x,
          preimg.naturalHeight - operations[i].y
        );
      }
      if (operations[i].type == "image") {
        let image = new Image();
        image.src = operations[i].src;
        mainCtx.drawImage(
          image,
          operations[i].x,
          preimg.naturalHeight - operations[i].y - operations[i].h,
          operations[i].w,
          operations[i].h
        );
      }
    }
  }

  function canvasHighlight(id) {
    let ox = operations[id].x;
    // console.log(mainCanvas.height+" "+operations[id].y)
    let y = mainCanvas.height - operations[id].y - operations[id].size; //  operations[id].y + operations[id].size
    let h = operations[id].size;
    let x,
      w = 0;
    let align = operations[id].align;
    if (align == "center") {
      w = mainCanvas.width;
      x = 0;
    }
    if (align == "right") {
      w = ox;
      x = 0;
    }
    if (align == "left") {
      w = mainCanvas.width - ox;
      x = ox;
    }
    // console.log(x +" "+ y +" "+ w +" "+ h)
    mainCtx.fillStyle = "rgba(41, 154, 197, 0.25)";
    mainCtx.fillRect(x, y, w, h);
  }

  async function loadFromJson() {
    operations = operations.replace(/&quot;/g, '"');
    operations = JSON.parse(operations);
    if (operations.length == 0) {
      document.getElementById("user-msg").innerText =
        "Select a base image to start editing your template";
      document.getElementById("current-process").innerText =
        "Waiting for a base image";
    }
    if (operations.length <= 1) return null;
    // console.log(operations)
    state.newbase = true;
    document.getElementById("base-image-pre").src = operations[0].src;
    let name = operations[0].src.split("/");
    document.getElementById("base-image-src-name").innerText = name[
      name.length - 1
    ].slice(14);
    document.getElementById("spacer").remove();
    for (let i = 1; i < operations.length; i++) {
      let rndid = Date.now() * i;
      let elem = document.createElement("div");
      elem.className = "card mb-3";
      if (operations[i].type == "text") {
        if (operations[i].value == "") operations[i].value = "text";
        elem.innerHTML +=
          '\
          <div class="card-body">  \
            <form class="form" id="' +
          i +
          '" name="' +
          i +
          '">  \
              <input type="text" name="type" value="text" style="display: none;">  \
              <div class="input-group mb-2">  \
                <div class="input-group-prepend">  \
                  <span class="input-group-text" style="width: 60px;">Name</span> \
                </div>  \
                <input type="text" class="form-control update-render" placeholder="Name" name="name" list="namelist" value="' +
          operations[i].name +
          '"> \
              </div>  \
              <div id="collapse-' +
          rndid +
          '" class="collapse">  \
                <div class="input-group mb-2">  \
                  <div class="input-group-prepend"> \
                    <span class="input-group-text" style="width: 60px;">Value</span>  \
                  </div>  \
                  <input type="text" class="form-control update-render" placeholder="Value (optional)" name="value" value="' +
          operations[i].value +
          '"> \
                </div>  \
                <div class="form-row mb-2"> \
                  <div class="col-md-5">  \
                    <div class="input-group"> \
                      <div class="input-group-prepend"> \
                        <span class="input-group-text" style="width: 35px;">X</span>  \
                      </div>  \
                      <input type="number" class="form-control update-render" placeholder="X position" name="x" step="10" value="' +
          operations[i].x +
          '">  \
                    </div>  \
                  </div>  \
                  <div class="col-md-5">  \
                    <div class="input-group"> \
                      <div class="input-group-prepend"> \
                        <span class="input-group-text" style="width: 35px;">Y</span>  \
                      </div>  \
                      <input type="number" class="form-control update-render" placeholder="Y position" name="y" step="10" value="' +
          operations[i].y +
          '">  \
                    </div>  \
                  </div>  \
                  <div class="col-md-2">  \
                    <button type="button" class="btn btn-light border update-position" data-toggle="tooltip" title="Move"><i class="fa fa-mouse-pointer" aria-hidden="true"></i></button> \
                  </div>  \
                </div>  \
                <div class="form-row mb-2"> \
                  <div class="col-sm-2">  \
                    <input type="color" name="color" class="form-control update-render" value="' +
          operations[i].color +
          '" data-toggle="tooltip" title="Color">  \
                  </div>  \
                  <div class="col-sm-7">  \
                    <select class="form-control update-render" name="font" data-toggle="tooltip" title="Font">  \
                      <option ' +
          (operations[i].font == "Arial" ? "selected" : "") +
          ">Arial</option>  \
                      <option " +
          (operations[i].font == "Arial Rounded" ? "selected" : "") +
          ">Arial Rounded</option>  \
                      <option " +
          (operations[i].font == "Courier New" ? "selected" : "") +
          ">Courier New</option>  \
                      <option " +
          (operations[i].font == "Georgia" ? "selected" : "") +
          ">Georgia</option>  \
                      <option " +
          (operations[i].font == "Lucida Console" ? "selected" : "") +
          ">Lucida Console</option> \
                      <option " +
          (operations[i].font == "Times New Roman" ? "selected" : "") +
          ">Times New Roman</option>  \
                      <option " +
          (operations[i].font == "Verdana" ? "selected" : "") +
          '>Verdana</option>  \
                    </select> \
                  </div>  \
                  <div class="col-sm-3">  \
                    <input type="number" name="size" min="1" step="5" class="form-control update-render" value="' +
          operations[i].size +
          '" data-toggle="tooltip" title="Size"> \
                  </div>  \
                </div>  \
                <div class="form-row mb-2"> \
                  <div class="col-md-6">  \
                    <input type="text" name="align" class="form-control" value="' +
          operations[i].align +
          '" style="display: none;"> \
                    <div class="btn-group btn-block"> \
                      <button type="button" class="btn ' +
          (operations[i].align == "left" ? "btn-dark" : "btn-light") +
          ' update-align" data-toggle="tooltip" title="Left Align" value="left"> \
                        <i class="fa fa-align-left" aria-hidden="true"></i> \
                      </button> \
                      <button type="button" class="btn ' +
          (operations[i].align == "center" ? "btn-dark" : "btn-light") +
          ' update-align" data-toggle="tooltip" title="Center Align" value="center">  \
                        <i class="fa fa-align-center" aria-hidden="true"></i> \
                      </button> \
                      <button type="button" class="btn ' +
          (operations[i].align == "right" ? "btn-dark" : "btn-light") +
          ' update-align" data-toggle="tooltip" title="Right Align" value="right"> \
                        <i class="fa fa-align-right" aria-hidden="true"></i>  \
                      </button> \
                    </div>  \
                  </div>  \
                  <div class="col-md-6">  \
                    <input type="text" name="style" class="form-control" value="' +
          operations[i].style +
          '" style="display: none;"> \
                    <div class="btn-group btn-block"> \
                      <button type="button" class="btn ' +
          (operations[i].style == "normal" ? "btn-dark" : "btn-light") +
          ' update-style" data-toggle="tooltip" title="Normal" value="normal">  \
                        <strong>N</strong>  \
                      </button> \
                      <button type="button" class="btn ' +
          (operations[i].style == "italic" ? "btn-dark" : "btn-light") +
          ' update-style" data-toggle="tooltip" title="Italic" value="italic"> \
                        <i class="fa fa-italic" aria-hidden="true"></i> \
                      </button> \
                      <button type="button" class="btn ' +
          (operations[i].style == "bold" ? "btn-dark" : "btn-light") +
          ' update-style" data-toggle="tooltip" title="Bold" value="bold"> \
                        <i class="fa fa-bold" aria-hidden="true"></i> \
                      </button> \
                    </div>  \
                  </div>  \
                </div>  \
              </div>  \
              <div class="btn-group btn-group-sm btn-block">  \
                <button class="btn btn-light border" data-toggle="collapse" data-target="#collapse-' +
          rndid +
          '" type="button" style="width: 80%;"><i class="fa fa-caret-down" aria-hidden="true"></i></button>  \
                <button class="btn btn-danger delete-btn" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>  \
              </div>  \
            </form> \
          </div>';
      }
      if (operations[i].type == "image") {
        let name = "No File Selected";
        if (operations[i].src) {
          name = operations[i].src.split("/");
          name = name[name.length - 1].slice(14);
        } else {
          operations[i].src = "/img/back.jpg";
        }
        if (operations[i].name.toLowerCase() == "qr") {
          operations[i].src = await getQR();
          name = "URL QRCode";
        }
        elem.innerHTML +=
          '\
          <div class="card-body">	\
            <form class="form" id="' +
          i +
          '" name="' +
          i +
          '">  \
            <div class="input-group mb-2">  \
              <div class="input-group-prepend">  \
                <span class="input-group-text" style="width: 60px;">Name</span> \
              </div>  \
              <input type="text" class="form-control update-render" placeholder="Name" list="namelist" name="name" value="' +
          operations[i].name +
          '"> \
              <input type="text" name="type" value="image" style="display: none;">  \
            </div>  \
            <div class="form-row mb-2">	\
              <div class="col-sm-4">	\
                <img src="' +
          operations[i].src +
          '" class="thumbnail square rounded border file-preview" style="width: 100%" height="90px">	\
              </div>	\
              <div class="col-sm-8">	\
                <p class="filename" style="margin-bottom: 23px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">' +
          name +
          '</p>	\
                <input class="file-input" type="file" accept=".png, .jpg, .jpeg" style="display: none;">	\
                <button type="button" class="btn btn-light btn-block border file-btn">	\
                  <i class="fa fa-picture-o" aria-hidden="true"></i> Load Image	\
                </button>	\
              </div>	\
            </div>	\
            <div class="collapse" id="collapse-' +
          rndid +
          '">	\
              <div class="form-row mb-2">	\
                <div class="col-md-12">	\
                <input type="text" value="' +
          operations[i].dynamic +
          '" name="dynamic" style="display: none;">	\
                  <button type="button" class="btn ' +
          (operations[i].dynamic == "true" ? "btn-success" : "btn-danger") +
          ' border update-dynamic btn-block" data-toggle="tooltip" title="Static / Dynamic">' +
          (operations[i].dynamic == "true" ? "Dynamic Image" : "Static Image") +
          '</button>	\
                </div>	\
              </div>	\
              <div class="form-row mb-2">	\
                <div class="col-md-5">	\
                  <div class="input-group">	\
                    <div class="input-group-prepend">	\
                      <span class="input-group-text" style="width: 25px;padding-left: 7px;">X</span>	\
                    </div>	\
                    <input type="number" class="form-control update-image-position" placeholder="X position" name="x" value="' +
          operations[i].x +
          '" step="10">	\
                  </div>	\
                </div>	\
                <div class="col-md-5">	\
                  <div class="input-group">	\
                    <div class="input-group-prepend">	\
                      <span class="input-group-text" style="width: 25px;padding-left: 7px;">Y</span>	\
                    </div>	\
                    <input type="number" class="form-control update-image-position" placeholder="Y position" name="y" value="' +
          operations[i].y +
          '" step="10">	\
                  </div>	\
                </div>	\
                <div class="col-md-2">	\
                  <button type="button" class="btn btn-light border update-position" data-toggle="tooltip" title="Move"><i class="fa fa-mouse-pointer" aria-hidden="true"></i></button>	\
                </div>	\
              </div>	\
              <div class="form-row mb-2">	\
                <div class="col-md-5">	\
                  <div class="input-group">	\
                    <div class="input-group-prepend">	\
                      <span class="input-group-text" style="width: 25px;padding-left: 5px;">W</span>	\
                    </div>	\
                    <input type="number" class="form-control update-image-render image-width" placeholder="Width" name="w" value="' +
          operations[i].w +
          '" step="10">	\
                  </div>	\
                </div>	\
                <div class="col-md-5">	\
                  <div class="input-group">	\
                    <div class="input-group-prepend">	\
                      <span class="input-group-text" style="width: 25px;padding-left: 5px;">H</span>	\
                    </div>	\
                    <input type="number" class="form-control update-image-render image-height" placeholder="Height" name="h" value="' +
          operations[i].h +
          '" step="10">	\
                  </div>	\
                </div>	\
                <div class="col-md-2">	\
                  <button type="button" class="btn btn-success border set-aspect-ratio" data-toggle="tooltip" title="Use Original Aspect Ratio"><i class="fa fa-chain-broken" aria-hidden="true"></i></button>	\
                </div>	\
              </div>	\
            </div>	\
            <div class="btn-group btn-group-sm btn-block">	\
              <button class="btn btn-light border" data-toggle="collapse" data-target="#collapse-' +
          rndid +
          '" type="button" style="width: 80%;"><i class="fa fa-caret-down" aria-hidden="true"></i></button>	\
              <button class="btn btn-danger delete-btn" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>	\
            </div>	\
            </form> \
          </div>';
      }
      document.getElementById("layers").appendChild(elem);
    }
    let sElem = document.createElement("div");
    sElem.id = "spacer";
    sElem.style.height = "100px";
    document.getElementById("layers").appendChild(sElem);
    $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
    setTimeout(updateRender, 500);
  }

  $("#layers").on("click", ".delete-btn", function () {
    let id = Number(this.form.id);
    operations.splice(id, 1);
    for (let i = id + 1; i <= operations.length; i++) {
      //console.log(document[i])
      document[i].id = i - 1;
      document[i].name = i - 1;
    }
    this.closest(".card").remove();
    updateRender();
    save_pending = true;
  });

  $("#layers").on("change", ".update-render", async function () {
    this.closest(".card-body").dispatchEvent(new Event("mouseleave"));
    let id = this.form.id;
    if (document[this.form.id].name.value.toLowerCase() == "qr") {
      let cb = this.closest(".card-body");
      $(cb).find(".thumbnail")[0].src = await getQR();
      operations[id].src = $(cb).find(".thumbnail")[0].src;
    }
    updateJSON(id);
    updateRender();
    canvasHighlight(id);
  });

  $("#layers").on("click", ".update-position", function () {
    // console.log(this.form.id)
    state.activeElem = this.form.id;
    state.x = Number(document[state.activeElem].x.value);
    state.y = Number(document[state.activeElem].y.value);
    state.newPosition = true;
    state.updatetimer = setInterval(function () {
      if (state.newPosition) {
        document[state.activeElem].x.value = state.x;
        document[state.activeElem].y.value = state.y;
        operations[state.activeElem].x = state.x;
        operations[state.activeElem].y = state.y;
        updateRender();
        canvasHighlight(state.activeElem);
      }
    }, 30);
    mainCanvas.style.cursor = "move";
    document.getElementById("user-msg").innerText =
      "Click on the image where you want to position the element";
    document.getElementById("current-process").innerText =
      "Waiting for a position";
  });

  $("#layers").on("change", ".update-image-position", function () {
    // console.log(this.form.id)
    operations[this.form.id].x = Number(document[this.form.id].x.value);
    operations[this.form.id].y = Number(document[this.form.id].y.value);
    updateRender();
  });

  $("#layers").on("change", ".update-image-render", function () {
    //console.log($(this.closest('.card-body')).find('.thumbnail'))
    let aspect_ratio =
      $(this.closest(".card-body")).find(".thumbnail")[0].naturalWidth /
      $(this.closest(".card-body")).find(".thumbnail")[0].naturalHeight;
    if ($(this.closest(".form-row")).find(".btn-success").length) {
      if (this.classList.contains("image-height")) {
        document[this.form.id].w.value = Number(
          Math.floor(document[this.form.id].h.value * aspect_ratio)
        );
        operations[this.form.id].w = document[this.form.id].w.value;
        operations[this.form.id].h = document[this.form.id].h.value;
      }
      if (this.classList.contains("image-width")) {
        operations[this.form.id].w = Number(document[this.form.id].w.value);
        document[this.form.id].h.value = Number(
          Math.floor(document[this.form.id].w.value / aspect_ratio)
        );
        operations[this.form.id].h = Number(document[this.form.id].h.value);
      }
    } else {
      operations[this.form.id].w = Number(document[this.form.id].w.value);
      operations[this.form.id].h = Number(document[this.form.id].h.value);
    }
    // console.log(operations[this.form.id].w+" "+operations[this.form.id].h)
    updateRender();
  });

  $("#layers").on("click", ".set-aspect-ratio", function () {
    if (this.classList.contains("btn-success"))
      this.classList.replace("btn-success", "btn-danger");
    else this.classList.replace("btn-danger", "btn-success");
  });

  $("#layers").on("click", ".update-align", function () {
    // console.log(this)
    this.closest(".btn-group").children[0].classList.replace(
      "btn-dark",
      "btn-light"
    );
    this.closest(".btn-group").children[1].classList.replace(
      "btn-dark",
      "btn-light"
    );
    this.closest(".btn-group").children[2].classList.replace(
      "btn-dark",
      "btn-light"
    );
    this.classList.replace("btn-light", "btn-dark");
    document[this.form.id].align.value = this.value;
    updateJSON(this.form.id);
    updateRender();
    canvasHighlight(this.form.id);
  });

  $("#layers").on("click", ".update-style", function () {
    // console.log(this)
    this.closest(".btn-group").children[0].classList.replace(
      "btn-dark",
      "btn-light"
    );
    this.closest(".btn-group").children[1].classList.replace(
      "btn-dark",
      "btn-light"
    );
    this.closest(".btn-group").children[2].classList.replace(
      "btn-dark",
      "btn-light"
    );
    this.classList.replace("btn-light", "btn-dark");
    document[this.form.id].style.value = this.value;
    updateJSON(this.form.id);
    updateRender();
    canvasHighlight(this.form.id);
  });

  $("#layers").on("click", ".file-btn", function () {
    $(this).closest(".col-sm-8").find(".file-input").click();
  });

  $("#layers").on("click", ".update-dynamic", function () {
    // $(this).closest(".col-sm-8").find('.file-input').click()
    let id = this.form.id;
    if (this.classList.contains("btn-success")) {
      this.classList.replace("btn-success", "btn-danger");
      document[this.form.id].dynamic.value = "false";
      operations[id].dynamic = "false";
      this.innerHTML = "Static Image";
    } else {
      this.classList.replace("btn-danger", "btn-success");
      document[this.form.id].dynamic.value = "true";
      operations[id].dynamic = "true";
      this.innerHTML = "Dynamic Image";
    }
  });

  $("#layers").on("change", ".file-input", function () {
    if (this.files.length == 0) return null;
    $(this)
      .closest(".col-sm-8")
      .find(".filename")[0].innerText = this.files[0].name;
    $(this)
      .closest(".form-row")
      .find(".file-preview")[0].src = window.URL.createObjectURL(this.files[0]);
    state.temp = this.files[0];
    $(this).closest(".form-row").find(".file-preview")[0].onload = function () {
      let id = this.closest("form").id;
      // console.log(id)
      operations[id].src = this.src;
      operations[id].w = this.naturalWidth;
      operations[id].h = this.naturalHeight;
      operations[id].x = 0;
      operations[id].y = 0;
      operations[id].file = state.temp;
      document[id].x.value = 0;
      document[id].y.value = 0;
      document[id].w.value = this.naturalWidth;
      document[id].h.value = this.naturalHeight;
      updateRender();
    };
  });

  $("#layers").on("mouseenter", ".card-body", function () {
    if (operations.length == 0) return null;
    if ($(this).find(".form").length == 0) return null;
    let id = $(this).find(".form")[0].id;
    // console.log(id)
    if (operations[id].type == "text") {
      // updateRender()
      canvasHighlight(id);
    }
  });

  $("#layers").on("mouseleave", ".card-body", function () {
    if (operations.length == 0) return null;
    if ($(this).find(".form").length == 0) return null;
    updateRender();
  });

  $("#add-text").on("click", function () {
    if (operations.length == 0) {
      document.getElementById("modal-msg").innerHTML =
        '\
        <div class="alert alert-warning mb-0"> \
          <strong>Warning!</strong> Select a base image.  \
        </div>';
      $("#modal-main").modal("show");
      return null;
    }
    document.getElementById("spacer").remove();
    let id = operations.length;
    let rndid = Date.now();
    let elem = document.createElement("div");
    elem.className = "card mb-3";
    elem.innerHTML +=
      '\
      <div class="card-body">  \
        <form class="form" id="' +
      id +
      '" name="' +
      id +
      '">  \
          <input type="text" name="type" value="text" style="display: none;">  \
          <div class="input-group mb-2">  \
            <div class="input-group-prepend">  \
              <span class="input-group-text" style="width: 60px;">Name</span> \
            </div>  \
            <input type="text" class="form-control update-render" name="name" list="namelist"> \
          </div>  \
          <div id="collapse-' +
      rndid +
      '" class="collapse">  \
            <div class="input-group mb-2">  \
              <div class="input-group-prepend"> \
                <span class="input-group-text" style="width: 60px;">Value</span>  \
              </div>  \
              <input type="text" class="form-control update-render" placeholder="Value (optional)" name="value" value="text"> \
            </div>  \
            <div class="form-row mb-2"> \
              <div class="col-md-5">  \
                <div class="input-group"> \
                  <div class="input-group-prepend"> \
                    <span class="input-group-text" style="width: 35px;">X</span>  \
                  </div>  \
                  <input type="number" class="form-control update-render" placeholder="X position" name="x" step="10" value="' +
      Math.floor(mainCanvas.width / 2) +
      '">  \
                </div>  \
              </div>  \
              <div class="col-md-5">  \
                <div class="input-group"> \
                  <div class="input-group-prepend"> \
                    <span class="input-group-text" style="width: 35px;">Y</span>  \
                  </div>  \
                  <input type="number" class="form-control update-render" placeholder="Y position" name="y" step="10" value="' +
      Math.floor(mainCanvas.height / 2) +
      '">  \
                </div>  \
              </div>  \
              <div class="col-md-2">  \
                <button type="button" class="btn btn-light border update-position" data-toggle="tooltip" title="Move"><i class="fa fa-mouse-pointer" aria-hidden="true"></i></button> \
              </div>  \
            </div>  \
            <div class="form-row mb-2"> \
              <div class="col-sm-2">  \
                <input type="color" name="color" class="form-control update-render" value="#ff0000" data-toggle="tooltip" title="Color">  \
              </div>  \
              <div class="col-sm-7">  \
                <select class="form-control update-render" name="font" data-toggle="tooltip" title="Font">  \
                  <option>Arial</option>  \
                  <option>Arial Rounded</option>  \
                  <option>Courier New</option>  \
                  <option>Georgia</option>  \
                  <option>Lucida Console</option> \
                  <option>Times New Roman</option>  \
                  <option>Verdana</option>  \
                </select> \
              </div>  \
              <div class="col-sm-3">  \
                <input type="number" name="size" min="1" step="5" class="form-control update-render" value="' +
      Math.floor(mainCanvas.height / 10) +
      '" data-toggle="tooltip" title="Size"> \
              </div>  \
            </div>  \
            <div class="form-row mb-2"> \
              <div class="col-md-6">  \
                <input type="text" name="align" class="form-control" value="center" style="display: none;"> \
                <div class="btn-group btn-block"> \
                  <button type="button" class="btn btn-light update-align" data-toggle="tooltip" title="Left Align" value="left"> \
                    <i class="fa fa-align-left" aria-hidden="true"></i> \
                  </button> \
                  <button type="button" class="btn btn-dark update-align" data-toggle="tooltip" title="Center Align" value="center">  \
                    <i class="fa fa-align-center" aria-hidden="true"></i> \
                  </button> \
                  <button type="button" class="btn btn-light update-align" data-toggle="tooltip" title="Right Align" value="right"> \
                    <i class="fa fa-align-right" aria-hidden="true"></i>  \
                  </button> \
                </div>  \
              </div>  \
              <div class="col-md-6">  \
                <input type="text" name="style" class="form-control" value="normal" style="display: none;"> \
                <div class="btn-group btn-block"> \
                  <button type="button" class="btn btn-dark update-style" data-toggle="tooltip" title="Normal" value="normal">  \
                    <strong>N</strong>  \
                  </button> \
                  <button type="button" class="btn btn-light update-style" data-toggle="tooltip" title="Italic" value="italic"> \
                    <i class="fa fa-italic" aria-hidden="true"></i> \
                  </button> \
                  <button type="button" class="btn btn-light update-style" data-toggle="tooltip" title="Bold" value="bold"> \
                    <i class="fa fa-bold" aria-hidden="true"></i> \
                  </button> \
                </div>  \
              </div>  \
            </div>  \
          </div>  \
          <div class="btn-group btn-group-sm btn-block">  \
            <button class="btn btn-light border" data-toggle="collapse" data-target="#collapse-' +
      rndid +
      '" type="button" style="width: 80%;"><i class="fa fa-caret-down" aria-hidden="true"></i></button>  \
            <button class="btn btn-danger delete-btn" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>  \
          </div>  \
        </form> \
      </div>';
    document.getElementById("layers").appendChild(elem);
    let sElem = document.createElement("div");
    sElem.id = "spacer";
    sElem.style.height = "100px";
    document.getElementById("layers").appendChild(sElem);
    $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
    updateJSON(id);
    updateRender();
  });

  $("#add-image").on("click", function () {
    if (operations.length == 0) {
      document.getElementById("modal-msg").innerHTML =
        '\
        <div class="alert alert-warning mb-0"> \
          <strong>Warning!</strong> Select a base image.  \
        </div>';
      $("#modal-main").modal("show");
      return null;
    }
    document.getElementById("spacer").remove();
    let id = operations.length;
    let rndid = Date.now();
    let elem = document.createElement("div");
    elem.className = "card mb-3";
    elem.innerHTML +=
      '\
      <div class="card-body">	\
        <form class="form" id="' +
      id +
      '" name="' +
      id +
      '">  \
        <div class="input-group mb-2">  \
          <div class="input-group-prepend">  \
            <span class="input-group-text" style="width: 60px;">Name</span> \
          </div>  \
          <input type="text" class="form-control update-render" name="name" list="namelist" > \
          <input type="text" name="type" value="image" style="display: none;">  \
        </div>  \
        <div class="form-row mb-2">	\
          <div class="col-sm-4">	\
            <img src="/img/back.jpg" class="thumbnail square rounded border file-preview" style="width: 100%" height="90px">	\
          </div>	\
          <div class="col-sm-8">	\
            <p class="filename" style="margin-bottom: 23px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">No File Selected</p>	\
            <input class="file-input" type="file" accept=".png, .jpg, .jpeg" style="display: none;">	\
            <button type="button" class="btn btn-light btn-block border file-btn">	\
              <i class="fa fa-picture-o" aria-hidden="true"></i> Load Image	\
            </button>	\
          </div>	\
        </div>	\
        <div class="collapse" id="collapse-' +
      rndid +
      '">	\
          <div class="form-row mb-2">	\
            <div class="col-md-12">	\
            <input type="text" value="false" name="dynamic" style="display: none;">	\
              <button type="button" class="btn btn-danger border update-dynamic btn-block" data-toggle="tooltip" title="Static / Dynamic">Static Image</button>	\
            </div>	\
          </div>	\
          <div class="form-row mb-2">	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 7px;">X</span>	\
                </div>	\
                <input type="number" class="form-control update-image-position" placeholder="X position" name="x" value="' +
      Math.floor(mainCanvas.width / 2) +
      '" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 7px;">Y</span>	\
                </div>	\
                <input type="number" class="form-control update-image-position" placeholder="Y position" name="y" value="' +
      Math.floor(mainCanvas.height / 2) +
      '" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-2">	\
              <button type="button" class="btn btn-light border update-position" data-toggle="tooltip" title="Move"><i class="fa fa-mouse-pointer" aria-hidden="true"></i></button>	\
            </div>	\
          </div>	\
          <div class="form-row mb-2">	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 5px;">W</span>	\
                </div>	\
                <input type="number" class="form-control update-image-render image-width" placeholder="Width" name="w" value="200" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 5px;">H</span>	\
                </div>	\
                <input type="number" class="form-control update-image-render image-height" placeholder="Height" name="h" value="200" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-2">	\
              <button type="button" class="btn btn-success border set-aspect-ratio" data-toggle="tooltip" title="Use Original Aspect Ratio"><i class="fa fa-chain-broken" aria-hidden="true"></i></button>	\
            </div>	\
          </div>	\
        </div>	\
        <div class="btn-group btn-group-sm btn-block">	\
          <button class="btn btn-light border" data-toggle="collapse" data-target="#collapse-' +
      rndid +
      '" type="button" style="width: 80%;"><i class="fa fa-caret-down" aria-hidden="true"></i></button>	\
          <button class="btn btn-danger delete-btn" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>	\
        </div>	\
        </form> \
      </div>';
    document.getElementById("layers").appendChild(elem);
    let sElem = document.createElement("div");
    sElem.id = "spacer";
    sElem.style.height = "100px";
    document.getElementById("layers").appendChild(sElem);
    $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
    operations.push({ type: "image" });
  });

  $("#add-qr").on("click", async function () {
    if (operations.length == 0) {
      document.getElementById("modal-msg").innerHTML =
        '\
        <div class="alert alert-warning mb-0"> \
          <strong>Warning!</strong> Select a base image.  \
        </div>';
      $("#modal-main").modal("show");
      return null;
    }
    let src = await getQR();
    document.getElementById("spacer").remove();
    let id = operations.length;
    let rndid = Date.now();
    let elem = document.createElement("div");
    elem.className = "card mb-3";
    elem.innerHTML +=
      '\
      <div class="card-body">	\
        <form class="form" id="' +
      id +
      '" name="' +
      id +
      '">  \
        <div class="input-group mb-2">  \
          <div class="input-group-prepend">  \
            <span class="input-group-text" style="width: 60px;">Name</span> \
          </div>  \
          <input type="text" class="form-control update-render" placeholder="Name" name="name" list="namelist" value="QR"> \
          <input type="text" name="type" value="image" style="display: none;">  \
        </div>  \
        <div class="form-row mb-2">	\
          <div class="col-sm-4">	\
            <img src="' +
      src +
      '" class="thumbnail square rounded border file-preview" style="width: 100%" height="90px">	\
          </div>	\
          <div class="col-sm-8">	\
            <p class="filename" style="margin-bottom: 23px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">URL QRCode</p>	\
            <input class="file-input" type="file" accept=".png, .jpg, .jpeg" style="display: none;">	\
            <button type="button" class="btn btn-light btn-block border file-btn">	\
              <i class="fa fa-picture-o" aria-hidden="true"></i> Load Image	\
            </button>	\
          </div>	\
        </div>	\
        <div class="collapse" id="collapse-' +
      rndid +
      '">	\
          <div class="form-row mb-2">	\
            <div class="col-md-12">	\
            <input type="text" value="false" name="dynamic" style="display: none;">	\
              <button type="button" class="btn btn-danger border update-dynamic btn-block" data-toggle="tooltip" title="Static / Dynamic">Static Image</button>	\
            </div>	\
          </div>	\
          <div class="form-row mb-2">	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 7px;">X</span>	\
                </div>	\
                <input type="number" class="form-control update-image-position" placeholder="X position" name="x" value="' +
      Math.floor(mainCanvas.width / 2) +
      '" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 7px;">Y</span>	\
                </div>	\
                <input type="number" class="form-control update-image-position" placeholder="Y position" name="y" value="' +
      Math.floor(mainCanvas.height / 2) +
      '" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-2">	\
              <button type="button" class="btn btn-light border update-position" data-toggle="tooltip" title="Move"><i class="fa fa-mouse-pointer" aria-hidden="true"></i></button>	\
            </div>	\
          </div>	\
          <div class="form-row mb-2">	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 5px;">W</span>	\
                </div>	\
                <input type="number" class="form-control update-image-render image-width" placeholder="Width" name="w" value="200" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-5">	\
              <div class="input-group">	\
                <div class="input-group-prepend">	\
                  <span class="input-group-text" style="width: 25px;padding-left: 5px;">H</span>	\
                </div>	\
                <input type="number" class="form-control update-image-render image-height" placeholder="Height" name="h" value="200" step="10">	\
              </div>	\
            </div>	\
            <div class="col-md-2">	\
              <button type="button" class="btn btn-success border set-aspect-ratio" data-toggle="tooltip" title="Use Original Aspect Ratio"><i class="fa fa-chain-broken" aria-hidden="true"></i></button>	\
            </div>	\
          </div>	\
        </div>	\
        <div class="btn-group btn-group-sm btn-block">	\
          <button class="btn btn-light border" data-toggle="collapse" data-target="#collapse-' +
      rndid +
      '" type="button" style="width: 80%;"><i class="fa fa-caret-down" aria-hidden="true"></i></button>	\
          <button class="btn btn-danger delete-btn" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>	\
        </div>	\
        </form> \
      </div>';
    document.getElementById("layers").appendChild(elem);
    let sElem = document.createElement("div");
    sElem.id = "spacer";
    sElem.style.height = "100px";
    document.getElementById("layers").appendChild(sElem);
    $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
    operations.push({
      name: "QR",
      type: "image",
      src: src,
      x: Math.floor(mainCanvas.width / 2),
      y: Math.floor(mainCanvas.height / 2),
      w: 200,
      h: 200,
    });
    updateRender();
  });

  $(".quality-val").on("mousedown", function () {
    state.updatetimer = setInterval(
      function (a) {
        if (state.temp != a.value) {
          $(a).tooltip("hide");
          a.setAttribute("data-original-title", "Quality: " + a.value + "%");
          $(a).tooltip("show");
          state.temp = a.value;
        }
      },
      50,
      this
    );
  });

  $(".quality-val").on("mouseup", function () {
    clearInterval(state.updatetimer);
  });

  //----------------------------- send file function-------------------------------------------------------------

  function getQR() {
    return new Promise((resolve) => {
      QRCode.toDataURL("Your document URL", function (err, qr) {
        resolve(qr);
      });
    });
  }

  console.log(operations);

  // let operations =
  // '[{&quot;src&quot;:&quot;preview.jpg&quot;,&quot;w&quot;:6600,&quot;h&quot;:4560},{&quot;type&quot;:&quot;text&quot;,&quot;name&quot;:&quot;Name&quot;,&quot;value&quot;:&quot;Y.
  // Manoj Kumar
  // Reddy&quot;,&quot;x&quot;:&quot;3390&quot;,&quot;y&quot;:&quot;2391&quot;,&quot;color&quot;:&quot;#1792b7&quot;,&quot;font&quot;:&quot;Arial
  // Rounded&quot;,&quot;size&quot;:&quot;230&quot;,&quot;align&quot;:&quot;center&quot;,&quot;style&quot;:&quot;normal&quot;},{&quot;type&quot;:&quot;text&quot;,&quot;name&quot;:&quot;College
  // Name&quot;,&quot;value&quot;:&quot;ABCD Institute
  // &quot;,&quot;x&quot;:&quot;3304&quot;,&quot;y&quot;:&quot;2112&quot;,&quot;color&quot;:&quot;#000000&quot;,&quot;font&quot;:&quot;Arial
  // Rounded&quot;,&quot;size&quot;:&quot;115&quot;,&quot;align&quot;:&quot;center&quot;,&quot;style&quot;:&quot;normal&quot;},{&quot;type&quot;:&quot;text&quot;,&quot;name&quot;:&quot;Registration
  // Id&quot;,&quot;value&quot;:&quot;FST001&quot;,&quot;x&quot;:&quot;1206&quot;,&quot;y&quot;:&quot;4168&quot;,&quot;color&quot;:&quot;#000000&quot;,&quot;font&quot;:&quot;Arial
  // Rounded&quot;,&quot;size&quot;:&quot;115&quot;,&quot;align&quot;:&quot;center&quot;,&quot;style&quot;:&quot;normal&quot;},{&quot;name&quot;:&quot;QR&quot;,&quot;type&quot;:&quot;image&quot;,&quot;src&quot;:null,&quot;x&quot;:1490,&quot;y&quot;:357,&quot;w&quot;:&quot;700&quot;,&quot;h&quot;:&quot;700&quot;}]'
});
function livePreview(e) {
  // console.log(e)
  if (e.files.length == 0) return null;
  state.newbase = true;
  document.getElementById("base-image-src-name").innerText = e.files[0].name;
  document.getElementById("base-image-pre").src = window.URL.createObjectURL(
    e.files[0]
  );
  // console.log(window.URL.createObjectURL(e.files[0]))
  state.temp = e.files[0];
}
function goBack() {
  if (save_pending) {
    document.getElementById("modal-msg").innerHTML =
      '\
    <div class="alert alert-warning mb-0"> \
      Your template has unsaved changes, you will lose these changes if you exit now.<br>  \
      <button type="button" class="btn btn-success float-right" style="width: 130px;" onclick="save()"><i class="fa fa-floppy-o" aria-hidden="true"></i>  Save</button>\
      <a href="/user/setting" class="btn btn-danger float-right" style="width: 130px;margin-right: 12px;" ><i class="fa fa-chevron-circle-left" aria-hidden="true"></i> Back to App</a>\
    </div>';
    $("#modal-main").modal("show");
  } else {
    window.location.pathname = "/user/setting";
  }
}
function toggleQuality() {
  // console.log($(".quality"))
  if ($(".quality")[0].style.display == "block")
    $(".quality")[0].style.display = "none";
  else $(".quality")[0].style.display = "block";
}

function downloadPreview() {
  // console.log("download")
  let a = document.createElement("a");
  a.target = "_blank";
  a.href = mainCanvas.toDataURL("image/jpeg", $(".quality-val")[0].value / 100);
  a.download = "preview.jpg";
  setTimeout(() => {
    a.click();
  }, 500);
}

async function save() {
  console.log("inside save function------------------------");
  console.log(operations);
  document.getElementById("modal-msg").innerHTML =
    '\
    <div class="alert alert-info mb-0"> \
      Your template is being saved, kindly wait until it is done.  \
    </div>';
  $("#modal-main").modal("show");

  for (let i = 1; i < operations.length; i++) {
    if (operations[i].type == "text") updateJSON(i);
  }
  if (operations.length == 0) {
    document.getElementById("user-msg").innerHTML =
      '<div class="text-warning"><strong>Warning!</strong>Select a base image</div>';
    document.getElementById("modal-msg").innerHTML =
      '\
      <div class="alert alert-warning mb-0"> \
        <strong>Warning!</strong> Select a base image.  \
      </div>';
    $("#modal-main").modal("show");
    return null;
  }
  if (operations.length == 1) {
    document.getElementById("user-msg").innerHTML =
      '<div class="text-warning"><strong>Warning!</strong> Add atleat one Text element</div>';
    document.getElementById("modal-msg").innerHTML =
      '\
      <div class="alert alert-warning mb-0"> \
        <strong>Warning!</strong> Add atleat one Text element.  \
      </div>';
    $("#modal-main").modal("show");
    return null;
  }

  if (document.getElementById("temp-name").value.length == 0) {
    document.getElementById("user-msg").innerHTML =
      '<div class="text-warning"><strong>Warning!</strong> Enter a name for the template to save it</div>';
    document.getElementById("modal-msg").innerHTML =
      '\
      <div class="alert alert-warning mb-0"> \
        <strong>Warning!</strong> Enter a name for the template to save it.  \
      </div>';
    $("#modal-main").modal("show");
    return null;
  }

  console.log("before json parse temp --------------------------------");
  let temp_operations = JSON.parse(JSON.stringify(operations));
  temp_operations[0] = operations[0];
  console.log(temp_operations[0].file);
  console.log("after json parse temp --------------------------------");
  if (temp_operations[0].src.match("blob") != null) {
    let sfile = await xhrSendFile(temp_operations[0].file);
    console.log(
      "sfile----------------------------------------------------------------------------------------"
    );
    console.log(sfile);
    console.log(sfile.status);
    if (sfile.status) {
      temp_operations[0].src = "/uploads/" + sfile.name;
      delete temp_operations[0].file;
      delete operations[0].file;
    } else {
      document.getElementById("modal-msg").innerHTML =
        '\
        <div class="alert alert-warning mb-0"> \
          <strong>Error!</strong> Failed to save Template. Contact Support.  \
        </div>';
      $("#modal-main").modal("show");
      return null;
    }
  }
  for (let i = 1; i < temp_operations.length; i++) {
    if (temp_operations[i].type == "image") {
      if (
        temp_operations[i].name == "" ||
        temp_operations[i].name == undefined
      ) {
        document.getElementById("user-msg").innerHTML =
          '<div class="text-warning"><strong>Warning!</strong> One of the Image element hasn\'t been assigned a name</div>';
        document.getElementById("modal-msg").innerHTML =
          '\
          <div class="alert alert-warning mb-0"> \
            <strong>Warning!</strong> One of the Image element doesn\'t have a name.  \
          </div>';
        $("#modal-main").modal("show");
        return null;
      }
      if (temp_operations[i].name.toLowerCase() == "qr") {
        temp_operations[i].src = null;
      }
      if (
        temp_operations[i].src != null ||
        temp_operations[i].src != undefined
      ) {
        if (temp_operations[i].src.match("blob") != null) {
          console.log("inside for if (save fn)-------------------------------");
          temp_operations[i].file = operations[i].file;
          console.log(temp_operations[i].file);
          let sfile = await xhrSendFile(temp_operations[i].file);
          console.log("sfile----------------------");
          console.log(sfile);
          if (sfile.status) {
            temp_operations[i].src = "/uploads/" + sfile.name;
            delete temp_operations[i].file;
            delete operations[i].file;
            operations[i].src = temp_operations[i].src;
          } else {
            document.getElementById("modal-msg").innerHTML =
              '\
              <div class="alert alert-warning mb-0"> \
                <strong>Error!</strong> Failed to save Template. Contact Support.  \
              </div>';
            $("#modal-main").modal("show");
            return null;
          }
        }
      }
    }
    if (temp_operations[i].type == "text") {
      if (temp_operations[i].value == "text") {
        temp_operations[i].value = "";
      }
      if (temp_operations[i].name == "") {
        document.getElementById("user-msg").innerHTML =
          '<div class="text-warning"><strong>Warning!</strong> One of the Text element hasn\'t been assigned a name</div>';
        document.getElementById("modal-msg").innerHTML =
          '\
          <div class="alert alert-warning mb-0"> \
            <strong>Warning!</strong> One of the Text element hasn\'t been assiged a name.  \
          </div>';
        $("#modal-main").modal("show");
        return null;
      }
    }
  }
  console.log("temp operations --------------------------------------------");
  console.log(temp_operations);
  let body = {};
  body.name = document.getElementById("temp-name").value;
  body.doctemp = document.getElementById("doc-temp-id").value;
  body.operations = JSON.stringify(temp_operations);
  console.log("body-----------------------------------");
  console.log(body);
  let xhr = new XMLHttpRequest();
  // xhr.open("POST", "/user/file/template", true);
  xhr.open("POST", "/api/database/template", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onload = function () {
    if (this.readyState === XMLHttpRequest.DONE && this.status == 200) {
      console.log("this response----------------");
      console.log(this.response);
      let resp;
      try {
        resp = JSON.parse(this.response);
        if (resp.status == true) {
          document.getElementById("user-msg").innerHTML =
            '<div class="text-success"><strong>Success!</strong> Template is successfully saved</div>';
          document.getElementById("modal-msg").innerHTML =
            '\
            <div class="alert alert-success mb-0"> \
              <strong>Success!</strong> Template is successfully saved.  \
            </div>';
        } else {
          document.getElementById("user-msg").innerHTML =
            '<div class="text-danger"><strong>Error!</strong> Failed to save Template</div>';
          document.getElementById("modal-msg").innerHTML =
            '\
            <div class="alert alert-danger mb-0"> \
              <strong>Error!</strong> Failed to save Template.  \
            </div>';
        }
      } catch (error) {
        document.getElementById("user-msg").innerHTML =
          '<div class="text-danger"><strong>Error!</strong> Your login session expired</div>';
        document.getElementById("modal-msg").innerHTML =
          '\
          <div class="alert alert-danger mb-0"> \
            <strong>Error!</strong> Your login session expired. Refresh and try again.  \
          </div>';
      }
      $("#modal-main").modal("show");
      save_pending = false;
    }
  };
  console.log("body stringyfy------------------------");
  console.log(JSON.stringify(body));
  xhr.send(JSON.stringify(body));
}

function xhrSendFile(file) {
  return new Promise((resolve, reject) => {
    try {
      // console.log("Starting filesend")
      let fd = new FormData();
      fd.append("certiimage", file);
      let xhr = new XMLHttpRequest();
      // xhr.open("POST", "/user/file/asset", true);
      xhr.open("POST", "/api/database/imageupload", true);
      xhr.onload = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status == 200) {
          // console.log("finished filesend")
          try {
            let resp = JSON.parse(this.response);
            resolve(resp);
          } catch (err) {
            document.getElementById("user-msg").innerHTML =
              '<div class="text-danger"><strong>Error!</strong> Your login session expired</div>';
            document.getElementById("modal-msg").innerHTML =
              '\
              <div class="alert alert-danger mb-0"> \
                <strong>Error!</strong> Your login session expired. Refresh and try again.  \
              </div>';
            $("#modal-main").modal("show");
          }
        }
      };
      console.log(file);
      console.log(fd);
      xhr.send(fd);
    } catch (err) {
      console.log(err);
      resolve(false);
    }
  });
}

function updateJSON(id) {
  console.log("id ❓" + id);
  save_pending = true;
  let formdata = $("#" + id).serializeArray();
  let src,
    file = null;
  if (operations[id] != undefined)
    if (operations[id].type != undefined)
      if (operations[id].type == "image") {
        src = operations[id].src;
        if (operations[id].file != undefined) file = operations[id].file;
      }
  let obj = {};
  for (let i = 0; i < formdata.length; i++) {
    obj[formdata[i].name] = formdata[i].value;
  }
  if (obj.x == "") obj.x = mainCanvas.width / 2;

  if (obj.y == "") obj.y = mainCanvas.width / 2;

  // console.log(obj);
  operations.splice(id, 1, obj);
  if (operations[id] != undefined)
    if (operations[id].type != undefined)
      if (operations[id].type == "image") {
        operations[id].src = src;
        if (file) operations[id].file = file;
      }
  console.log(operations);
}
