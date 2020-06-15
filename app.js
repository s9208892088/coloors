// global selections and variables
const color_divs = document.querySelectorAll(".color");
const generate_button = document.querySelector(".generate");
const lock_button = document.querySelectorAll(".lock");
const sliders = document.querySelectorAll("input[type='range']");
const currentHexes = document.querySelectorAll(".color h2");
let initial_colors;
const copy_pop_up = document.querySelector(".copy_container");
const adjust_button = document.querySelectorAll(".adjust");
const sliders_panel = document.querySelectorAll("div.sliders");
const close_adjustment_button = document.querySelectorAll(".close_adjustment");
let saved_palettes;
if (localStorage.getItem("palettes") === null) {
  saved_palettes = [];
} else {
  saved_palettes = JSON.parse(localStorage.getItem("palettes"));
}

// event listener
lock_button.forEach((lock, index) => {
  lock.addEventListener("click", () => {
    change_lock(index);
  });
});

generate_button.addEventListener("click", random_colors);

sliders.forEach((slider) => {
  slider.addEventListener("input", hsl_control);
});

color_divs.forEach((div, index) => {
  div.addEventListener("change", () => {
    update_text_UI(index); // this index automatically refers to the color div
  });
});

currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copy_to_clipboard(hex);
  });
});

adjust_button.forEach((button, index) => {
  button.addEventListener("click", () => {
    show_sliders(index);
  });
});

close_adjustment_button.forEach((button, index) => {
  button.addEventListener("click", () => {
    close_sliders(index);
  });
});

copy_pop_up.children[0].addEventListener("transitionend", () => {
  copy_pop_up.classList.remove("active");
  copy_pop_up.children[0].classList.remove("active");
});

// functions

function update_text_UI(index) {
  const active_div = color_divs[index];
  const background_color = chroma(active_div.style.backgroundColor);
  const hex_text = active_div.querySelector("h2");
  hex_text.innerText = background_color.hex();

  //check contrast
  check_text_contrast(background_color, hex_text);
  //icons as well
  const icons = active_div.querySelectorAll(".controls button");
  for (let i = 0; i < icons.length; i++) {
    check_text_contrast(background_color, icons[i]);
    console.log("checking");
  }
}

// change the background color according to slider's input change
function hsl_control(e) {
  const index =
    e.target.getAttribute("data-hue") ||
    e.target.getAttribute("data-brightness") ||
    e.target.getAttribute("data-saturation");
  // index will show which background the input is under

  //here we get the value of the inputs
  const three_sliders = e.target.parentElement.querySelectorAll(
    "input[type='range']"
  );
  const new_hue_value = three_sliders[0].value;
  const new_brightness_value = three_sliders[1].value;
  const new_saturation_value = three_sliders[2].value;

  const background_color_text = initial_colors[index];
  let new_color = chroma(background_color_text)
    .set("hsl.s", new_saturation_value)
    .set("hsl.l", new_brightness_value)
    .set("hsl.h", new_hue_value);

  color_divs[index].style.backgroundColor = new_color;

  const all_sliders = e.target.parentElement.querySelectorAll(
    "input[type='range']"
  );

  colorize_sliders(new_color, all_sliders[0], all_sliders[1], all_sliders[2]);
}

//color generator
function generate_hex() {
  /*
  const letters = "#0123456789ABCDEF";
  let hash = "#";
  for (let i = 0; i < 6; i++) {
    hash = hash + letters[Math.floor(Math.random() * 16)];
  }
  return hash;
  */

  // this is okay but there is already a chroma js
  // so there we will just use chroma js
  const hex_color = chroma.random();
  return hex_color;
}

function random_colors() {
  // set the initial_colors to an empty array
  initial_colors = [];

  color_divs.forEach((div, index) => {
    const hex_text = div.children[0];
    const random_color = generate_hex();
    const buttons = div.querySelectorAll(".controls button");

    // add the random color to initial_colors array
    if (div.classList.contains("locked")) {
      initial_colors.push(hex_text);
      return;
    } else {
      initial_colors.push(random_color.hex());
    }

    // add the color to the background
    div.style.backgroundColor = random_color;
    hex_text.innerText = random_color;

    // check if we need to change the hex_text color
    check_text_contrast(random_color, hex_text);
    buttons.forEach((i) => {
      check_text_contrast(random_color, i);
    });

    //initial colorize slider
    const color = chroma(random_color);
    const sliders = div.querySelectorAll(".sliders input");
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];
    colorize_sliders(color, hue, brightness, saturation);
  });

  // adapt the sliders input position
  reset_inputs();
}

function reset_inputs() {
  sliders.forEach((slider) => {
    if (slider.name === "hue") {
      const hue_color = initial_colors[slider.getAttribute("data-hue")];
      const hue_value = chroma(hue_color).hsl()[0];
      slider.value = hue_value;
    }
    if (slider.name === "brightness") {
      const brightness_color =
        initial_colors[slider.getAttribute("data-brightness")];
      const brightness_value = chroma(brightness_color).hsl()[2];
      slider.value = brightness_value;
    }
    if (slider.name === "saturation") {
      const saturation_color =
        initial_colors[slider.getAttribute("data-saturation")];
      const saturation_value = chroma(saturation_color).hsl()[1];
      slider.value = saturation_value;
    }
  });
}

function colorize_sliders(color, hue, brightness, saturation) {
  // saturation's scale
  const no_saturation = color.set("hsl.s", 0);
  const full_saturation = color.set("hsl.s", 1);
  const saturation_scale = chroma.scale([
    no_saturation,
    color,
    full_saturation,
  ]);

  // brightness's scale
  const middle_brightness = color.set("hsl.l", 0.5);
  const brightness_scale = chroma.scale(["black", middle_brightness, "white"]);

  //update input's background color
  saturation.style.backgroundImage = `linear-gradient(to right, ${saturation_scale(
    0
  )}, ${saturation_scale(1)}`;
  brightness.style.backgroundImage = `linear-gradient(to right, ${brightness_scale(
    0
  )}, 
  ${brightness_scale(0.5)},
  ${brightness_scale(1)})`;
  hue.style.backgroundImage = `linear-gradient(to right, rgb(255, 0, 0), rgb(255,255 ,0),rgb(0, 255, 0),rgb(0, 255, 255),rgb(0,0,255),rgb(255,0,255),rgb(255,0,0))`;
}

function check_text_contrast(color, text) {
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

function copy_to_clipboard(hex) {
  const el = document.createElement("textarea");
  el.value = hex.innerText;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);

  //pop up animation
  copy_pop_up.classList.add("active");
  copy_pop_up.children[0].classList.add("active");
}

function show_sliders(index) {
  sliders_panel[index].classList.toggle("active");
}

function close_sliders(index) {
  sliders_panel[index].classList.remove("active");
}

function change_lock(index) {
  /*
  console.log(lock_button[index].children[0].classList);
  */
  color_divs[index].classList.toggle("locked");
  lock_button[index].children[0].classList.toggle("fa-lock-open");
  lock_button[index].children[0].classList.toggle("fa-lock");
}

// save and library stuff
const save_button = document.querySelector(".save");
const save_container = document.querySelector(".save_container");
const save_pop_up = document.querySelector(".save_popup");
const close_save = document.querySelector(".close_save");
const submit_save = document.querySelector(".submit_save");
const library_button = document.querySelector(".library");
const library_container = document.querySelector(".library_container");
const library_popup = document.querySelector(".library_popup");
const close_library_button = document.querySelector(".close_library");

save_button.addEventListener("click", show_save);
close_save.addEventListener("click", close_save_panel);
submit_save.addEventListener("click", save_palette);
library_button.addEventListener("click", show_library);
close_library_button.addEventListener("click", close_library);

function show_save() {
  save_container.classList.toggle("active");
  save_pop_up.classList.toggle("active");
}
function close_save_panel() {
  save_container.classList.remove("active");
  save_pop_up.classList.remove("active");
}
function show_library() {
  library_container.classList.toggle("active");
  library_popup.classList.toggle("active");
}
function close_library() {
  library_container.classList.remove("active");
  library_popup.classList.remove("active");
}
function save_palette(e) {
  let fake_name = e.target.parentElement.children[2].value;
  if (fake_name !== "") {
    name = fake_name;
  } else {
    window.alert("Invalid Name");
    return;
  }
  const colors = [];
  save_container.classList.remove("active");
  save_pop_up.classList.remove("active");
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });
  //generate object
  const palette_object = {
    name: name,
    colors: colors,
    number: saved_palettes.length,
  };

  //store in local storage
  push_into_local(palette_object);

  e.target.parentElement.children[2].value = "";

  //generate a palette for library
  const palette = document.createElement("div");
  palette.classList.add("custom_palette");
  const title = document.createElement("h4");
  title.innerText = palette_object.name;
  const preview = document.createElement("div");
  preview.classList.add("small_preview");
  palette_object.colors.forEach((color) => {
    const small_div = document.createElement("div");
    small_div.style.backgroundColor = color;
    preview.appendChild(small_div);
  });
  const palette_button = document.createElement("button");
  palette_button.classList.add("pick_palette_button");
  palette_button.classList.add(palette_object.number);
  palette_button.innerText = "select";

  // event listener to the palette button
  palette_button.addEventListener("click", (e) => {
    close_library();
    initial_colors = [];
    palette_index = e.target.classList[1];
    saved_palettes[palette_index].colors.forEach((color, index) => {
      initial_colors.push(color);
      color_divs[index].style.backgroundColor = color;
      color_divs[index].children[0].innerText = color;
      update_text_UI(index);

      colorize_sliders(
        chroma(color),
        color_divs[index].children[2].children[2],
        color_divs[index].children[2].children[4],
        color_divs[index].children[2].children[6]
      );
    });
    reset_inputs();
  });

  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(palette_button);
  library_popup.appendChild(palette);
}
function push_into_local(palette_object) {
  saved_palettes.push(palette_object);
  localStorage.setItem("palettes", JSON.stringify(saved_palettes));
}

function get_local_storage() {
  if (localStorage.getItem("palettes") === null) {
    return;
  } else {
    const palettes_objects = JSON.parse(localStorage.getItem("palettes"));
    palettes_objects.forEach((palette_object) => {
      //generate a palette for library
      const palette = document.createElement("div");
      palette.classList.add("custom_palette");
      const title = document.createElement("h4");
      title.innerText = palette_object.name;
      const preview = document.createElement("div");
      preview.classList.add("small_preview");
      palette_object.colors.forEach((color) => {
        const small_div = document.createElement("div");
        small_div.style.backgroundColor = color;
        preview.appendChild(small_div);
      });
      const palette_button = document.createElement("button");
      palette_button.classList.add("pick_palette_button");
      palette_button.classList.add(palette_object.number);
      palette_button.innerText = "select";

      // event listener to the palette button
      palette_button.addEventListener("click", (e) => {
        close_library();
        initial_colors = [];
        palette_index = e.target.classList[1];
        saved_palettes[palette_index].colors.forEach((color, index) => {
          initial_colors.push(color);
          color_divs[index].style.backgroundColor = color;
          color_divs[index].children[0].innerText = color;
          update_text_UI(index);

          colorize_sliders(
            chroma(color),
            color_divs[index].children[2].children[2],
            color_divs[index].children[2].children[4],
            color_divs[index].children[2].children[6]
          );
        });
        reset_inputs();
      });

      palette.appendChild(title);
      palette.appendChild(preview);
      palette.appendChild(palette_button);
      library_popup.appendChild(palette);
    });
  }
}

console.log(JSON.parse(localStorage.getItem("palettes")));
get_local_storage();
random_colors();
