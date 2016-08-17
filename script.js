var particleDrivenMap = function(input_data){//
  // Proper encapsulation
  /*

  This is a graph constructor.
  HowTo:
  - Ctrl+drag a node to move it.
  - Shift+click to start links (you can start multiple links from different nodes and attach them to one node).
  - Click on a node after you've started some links, to attach your links to that node.
  - Meta+click to start an alternative link (different color)
  - use dat.GUI panel on the right and "addParticle" button to add new node.
  - use clearing_links to clear all the links or alternative links STARTED from the given node. You can choose the node by clicking it or enter it's number manually

  Mechanics of particle and approach inspired by
  http://codepen.io/soulwire/pen/Ffvlo/

  */

  // //  Code to initiate fps counter // // //
  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);
  // // // // // // // // // // // // // // //

  // // Code to initiate DAT GUI panel // // //
  var Nexus = function(){
    // we keep things here that are supposed
    // to be available in the control panel
    // it's like a control center, it will be instantiated as "settings" later.

    //We're gonna use this as distance to the mouse pointer
    //We're squaring this value to compare squares later
    //Which frees us from having to use sqrt
    this.BRUSH_THICKNESS_SLIDER = 100;
    this.BRUSH_THICKNESS = Math.pow(this.BRUSH_THICKNESS_SLIDER, 2);
    this.MANIPULATOR_THICKNESS = Math.pow(5,2);

    this.PARTICLE_NUMBER = 0;//how many random particles to add if there's no input data

    this.MOUSE_FORCE_ACTIVE = true;
    this.MOUSE_FORCE = -0.32;
    this.ORIGIN_FORCE_ACTIVE = true;
    this.ORIGIN_FORCE = 0.1;

    this.FRICTION = 0.02;
    this.SPEED_MIN = 0.1;
    this.SPEED_MAX = 0.1;
    this.SPEED_MIN_SQUARED = Math.pow(this.SPEED_MIN,2);
    this.SPEED_MAX_SQUARED = Math.pow(this.SPEED_MAX,2);

    this.display_numbers = false;

    this.target_node_number = -1;
    this.manual_target = -1;
		this.ox=0;
    this.oy=0;

    this.node_radius = 3;

    ////////////////////////////////////////////////////////////

    //  												COLORS

    ////////////////////////////////////////////////////////////

    this.colors = function(){
      this.node = function(){
        this.fill = '#5EBFE2';
       	this.regular = '#065E83';//'rgba(255,50,50,1)';
        this.hovered = 'rgba(0,255,0,1)';
        this.being_linked = 'rgba(255,255,255,1)';
        this.being_linked_alt = 'rgba(200,200,200,1)';
      };
      this.link = function(){
       	this.regular = '#368FB2';//'rgba(50,255,50,1)';
        this.alternative = '#7D7F82';//'rgba(255,255,0,1)';
        this.being_linked = 'rgba(255,255,255,1)';
        this.being_linked_alt = 'rgba(200,200,200,1)';
      };
      //replacing definitions with instances under the same name
      this.node = new this.node();
      this.link = new this.link();
    }
    //replacing definitions with instances under the same name
    this.colors = new this.colors();

    ////////////////////////////////////////////////////////////


    this.load = function(){
      console.log("Loading from local storage");
      particle_list = JSON.parse(localStorage["particle_list"]);
    }

    this.save = function(){
      console.log("Saving to local storage");
      localStorage["particle_list"] = JSON.stringify(particle_list);
    }

    this.delete = function(){
      if(confirm("Are you sure you want to delete the data from local storage?")){
        console.log("Deleting local storage");
        localStorage["particle_list"] = null;
      }
    }

    this.compact = function(){
      var n = particle_list.length;
      var i = n;
      while(i--){
        p = particle_list[i];
        p.ox = Math.round(p.ox);
        p.oy = Math.round(p.oy);
        p.x = p.ox;
        p.y = p.oy;
        p.vx = 0;
        p.vy = 0;
      }
    }


    this.log = function(){
      //console.log(localStorage["particle_list"]);
      console.log(JSON.stringify(particle_list));
    }

    this.import = function(){
      particle_list = JSON.parse(prompt("Paste the stringified particle_list array here."));
    }

    this.export = function(){
      prompt("Here you can copy the stringified particle_list array. Good luck! If you can't copy it cause it's too long, use storage/save and storage/log to dump the list to the console. ",JSON.stringify(particle_list));
    }

    this.normalize = function(){
      console.log("adding links_alt arrays to all particles");
      var n = particle_list.length;
      var i = n;
      while(i--){
        particle_list[i].links_alt = [];
      }
    }

    this.clearLinks = function(){
        particle_list[this.target_node_number].links = [];
    }

    this.clearAltLinks = function(){
        particle_list[this.target_node_number].links_alt = [];
    }

    this.addParticle = function(){
      p = addParticle(0,0);
      p.dragged = true;
    }

    this.getNode = function(){
      this.ox = particle_list[this.target_node_number].ox;
      this.oy = particle_list[this.target_node_number].oy;
      updateGui(gui);
    }

    this.setNode = function(){
      particle_list[this.target_node_number].ox = this.ox;
      particle_list[this.target_node_number].oy = this.oy;
    }

    this.forceNode = function(){
      particle_list[this.target_node_number].x = this.ox;
      particle_list[this.target_node_number].y = this.oy;
    }

    this.shake = function(){
      var n = particle_list.length;
      var i = n;
      while(i--){
        var p = particle_list[i];
        p.vx = (Math.random()-0.5)*2;
        p.vy = (Math.random()-0.5)*2;
      }
    }

    this.shake_down = function(){
      var n = particle_list.length;
      var i = n;
      while(i--){
        var p = particle_list[i];
        p.vy = (Math.random());
      }
    }

    this.shake_left = function(){
      var n = particle_list.length;
      var i = n;
      while(i--){
        var p = particle_list[i];
        p.vx = -(Math.random());
      }
    }

  }//end of Nexus

  // all the useful names for the thing
  var mainControlNexus = new Nexus();
  var mcn = mainControlNexus;
  var settings = mainControlNexus;

  var gui = new dat.GUI();

  gui.add(mcn,"ORIGIN_FORCE_ACTIVE");
  gui.add(mcn,"ORIGIN_FORCE",-0.1,1).step(0.01);
  gui.add(mcn,"MOUSE_FORCE_ACTIVE");


  (function(){//this is an ugly hack enclosed here
    var temp = mcn.MOUSE_FORCE;
    // Setting to positive to circumvent the dat GUI bug
    // which breaks the slider for negative values
    // see: https://code.google.com/p/dat-gui/issues/detail?id=39
    mcn.MOUSE_FORCE = 0.5;
    gui.add(mcn,"MOUSE_FORCE", -(0.8), 1.3).step(0.01);
  	//setting back to the original value, slider will follow accordingly
    mcn.MOUSE_FORCE = temp;
    updateGui(gui);
  })();


  gui.add(mcn,"FRICTION",0,0.2).step(0.01);
  var ctrlsSpeedMin = gui.add(mcn,"SPEED_MIN",0,2.1);
  //var ctrlsSpeedMax = gui.add(mcn,"SPEED_MAX",0,10);

  gui.add(mcn,"display_numbers");
  gui.add(mcn,"MANIPULATOR_THICKNESS", 10, 900).step(10);

  var ctrlBrushThicknessSlider = gui.add(mcn,"BRUSH_THICKNESS_SLIDER",10,1000).step(10);
    ctrlBrushThicknessSlider.onChange(function(){
      mcn.BRUSH_THICKNESS = Math.pow(mcn.BRUSH_THICKNESS_SLIDER,2);
    });

  gui.add(mcn,"shake");
  gui.add(mcn,"shake_down");
  gui.add(mcn,"shake_left");

  var f1 = gui.addFolder("storage");
    f1.add(mcn,"load");
    f1.add(mcn,"save");
    f1.add(mcn,"delete");
    f1.add(mcn,"log");
    f1.add(mcn,"normalize");
    f1.add(mcn,"compact");

  var f2 = gui.addFolder("import/export");
    f2.add(mcn,"import");
    f2.add(mcn,"export");

  var f3 = gui.addFolder("clearing_links");
    f3.add(mcn,"target_node_number").listen();
    f3.add(mcn,"clearLinks");
    f3.add(mcn,"clearAltLinks");

  var f4 = gui.addFolder("editing nodes");
    f4.add(mcn,"target_node_number").listen();
    var ctrlTargetManual = f4.add(mcn,"manual_target");
    var ctrlOx = f4.add(mcn,"ox",-100,100);
    var ctrlOy = f4.add(mcn,"oy");
    f4.add(mcn,"getNode");
    f4.add(mcn,"setNode");
    f4.add(mcn,"forceNode");
  gui.add(mcn,"addParticle");

  //gui helpers
  ctrlTargetManual.onChange(function(){
    mcn.target_node_number = mcn.manual_target;
  });

  ctrlOx.onChange(function(){
  	mcn.setNode();
  });
  ctrlOy.onChange(function(){
    mcn.setNode();
  });

  function updateGui(gui){
    console.debug(gui);
    for (var i in gui.__controllers) {
      gui.__controllers[i].updateDisplay();
    }
    for (var i in gui.__folders) {
      for (var j in gui.__folders[i].__controllers)
      gui.__folders[i].__controllers[j].updateDisplay();
    }
  }

  // // // // // // // // // // // // // // //

  // Dreaded globals, they're locals now ;P
  var canvas,
      ctx,
      particle,
      particle_list,
      w, h,
      p, previous_p,
      mx,my,
      dx,dy,
      d,f,
      odx, ody,
      od,
      f,of
  ;
  var linked_particle_list = [];//list of particles that are being linked to something right now
  var hovered_particle = null;//a reference to a particle that is being hovered right now

  var PARTICLES_NUMBER = 0;//this was used in auto-generation in the past, dead now.



  var source_data = [

  {"ox":53,"oy":151,"number":0},
  {"ox":67,"oy":184,"number":1},
  {"ox":56,"oy":227,"number":2},
  {"ox":44,"oy":271,"number":3},
  {"ox":67,"oy":279,"number":4},
  {"ox":128,"oy":176,"number":5},
  {"ox":133,"oy":317,"number":6},
  {"ox":175,"oy":121,"number":7},
  {"ox":169,"oy":222,"number":8},
  {"ox":191,"oy":298,"number":9},
  {"ox":158,"oy":343,"number":10},
  {"ox":267,"oy":204,"number":11},
  {"ox":235,"oy":256,"number":12},
  {"ox":239,"oy":349,"number":13},
  {"ox":187,"oy":383,"number":14},
  {"ox":191,"oy":398,"number":15},
  {"ox":190,"oy":413,"number":16},
  {"ox":191,"oy":470,"number":17},
  {"ox":212,"oy":493,"number":18},
  {"ox":249,"oy":525,"number":19},
  {"ox":272,"oy":550,"number":20},
  {"ox":247,"oy":498,"number":21},
  {"ox":250,"oy":447,"number":22},
  {"ox":223,"oy":428,"number":23},
  {"ox":267,"oy":409,"number":24},
  {"ox":284,"oy":455,"number":25},
  {"ox":276,"oy":486,"number":26},
  {"ox":319,"oy":522,"number":27},
  {"ox":317,"oy":581,"number":28},
  {"ox":336,"oy":518,"number":29},
  {"ox":326,"oy":500,"number":30},
  {"ox":337,"oy":459,"number":31},
  {"ox":364,"oy":487,"number":32},
  {"ox":415,"oy":541,"number":33},
  {"ox":407,"oy":515,"number":34},
  {"ox":414,"oy":484,"number":35},
  {"ox":377,"oy":441,"number":36},
  {"ox":349,"oy":418,"number":37},
  {"ox":288,"oy":374,"number":38},
  {"ox":401,"oy":436,"number":39},
  {"ox":435,"oy":460,"number":40},
  {"ox":445,"oy":451,"number":41},
  {"ox":454,"oy":450,"number":42},
  {"ox":466,"oy":436,"number":43},
  {"ox":441,"oy":415,"number":44},
  {"ox":453,"oy":413,"number":45},
  {"ox":506,"oy":420,"number":46},
  {"ox":480,"oy":394,"number":47},
  {"ox":411,"oy":368,"number":48},
  {"ox":486,"oy":351,"number":49},
  {"ox":532,"oy":338,"number":50},
  {"ox":478,"oy":302,"number":51},
  {"ox":480,"oy":241,"number":52},
  {"ox":429,"oy":255,"number":53},
  {"ox":353,"oy":249,"number":54},
  {"ox":343,"oy":299,"number":55},
  {"ox":323,"oy":328,"number":56},
  {"ox":349,"oy":164,"number":57},
  {"ox":477,"oy":37,"number":58},
  {"ox":552,"oy":120,"number":59},
  {"ox":728,"oy":148,"number":60},
  {"ox":578,"oy":197,"number":61},
  {"ox":569,"oy":235,"number":62},
  {"ox":590,"oy":273,"number":63},
  {"ox":646,"oy":210,"number":64},
  {"ox":724,"oy":215,"number":65},
  {"ox":750,"oy":220,"number":66},
  {"ox":748,"oy":208,"number":67},
  {"ox":730,"oy":234,"number":68},
  {"ox":354,"oy":611,"number":69},
  {"ox":396,"oy":604,"number":70},
  {"ox":400,"oy":634,"number":71},
  {"ox":489,"oy":631,"number":73},
  {"ox":465,"oy":639,"number":74},
  {"ox":443,"oy":653,"number":75},
  {"ox":449,"oy":663,"number":76},
  {"ox":438,"oy":666,"number":77},
  {"ox":428,"oy":689,"number":78},
  {"ox":420,"oy":697,"number":79},
  {"ox":420,"oy":728,"number":80},
  {"ox":434,"oy":752,"number":81},
  {"ox":439,"oy":761,"number":82},
  {"ox":446,"oy":731,"number":83},
  {"ox":481,"oy":774,"number":84},
  {"ox":500,"oy":789,"number":85},
  {"ox":496,"oy":821,"number":86},
  {"ox":468,"oy":873,"number":87},
  {"ox":460,"oy":909,"number":88},
  {"ox":456,"oy":923,"number":89},
  {"ox":468,"oy":927,"number":90},
  {"ox":497,"oy":939,"number":91},
  {"ox":484,"oy":908,"number":92},
  {"ox":503,"oy":860,"number":93},
  {"ox":521,"oy":872,"number":94},
  {"ox":532,"oy":885,"number":95},
  {"ox":546,"oy":885,"number":96},
  {"ox":571,"oy":853,"number":97},
  {"ox":538,"oy":823,"number":98},
  {"ox":574,"oy":811,"number":99},
  {"ox":598,"oy":815,"number":100},
  {"ox":615,"oy":810,"number":101},
  {"ox":611,"oy":790,"number":102},
  {"ox":589,"oy":772,"number":103},
  {"ox":547,"oy":771,"number":104},
  {"ox":504,"oy":733,"number":105},
  {"ox":526,"oy":702,"number":106},
  {"ox":534,"oy":651,"number":107},
  {"ox":547,"oy":657,"number":108},
  {"ox":565,"oy":655,"number":109},
  {"ox":569,"oy":684,"number":110},
  {"ox":586,"oy":694,"number":111},
  {"ox":619,"oy":714,"number":112},
  {"ox":655,"oy":715,"number":113},
  {"ox":659,"oy":728,"number":114},
  {"ox":640,"oy":755,"number":115},
  {"ox":787,"oy":654,"number":116},
  {"ox":778,"oy":645,"number":117},
  {"ox":771,"oy":635,"number":118},
  {"ox":752,"oy":609,"number":119},
  {"ox":758,"oy":588,"number":120},
  {"ox":786,"oy":595,"number":121},
  {"ox":772,"oy":536,"number":122},
  {"ox":797,"oy":505,"number":123},
  {"ox":806,"oy":516,"number":124},
  {"ox":811,"oy":498,"number":125},
  {"ox":863,"oy":478,"number":126},
  {"ox":901,"oy":472,"number":127},
  {"ox":918,"oy":499,"number":128},
  {"ox":1005,"oy":508,"number":129},
  {"ox":1014,"oy":523,"number":130},
  {"ox":1091,"oy":674,"number":131},
  {"ox":1059,"oy":722,"number":132},
  {"ox":1020,"oy":829,"number":133},
  {"ox":996,"oy":869,"number":134},
  {"ox":984,"oy":876,"number":135},
  {"ox":945,"oy":876,"number":136},
  {"ox":935,"oy":811,"number":137},
  {"ox":926,"oy":773,"number":138},
  {"ox":920,"oy":752,"number":139},
  {"ox":918,"oy":732,"number":140},
  {"ox":896,"oy":684,"number":141},
  {"ox":905,"oy":665,"number":142},
  {"ox":861,"oy":648,"number":143},
  {"ox":850,"oy":655,"number":144},
  {"ox":842,"oy":659,"number":145},
  {"ox":836,"oy":618,"number":146},
  {"ox":802,"oy":618,"number":147},
  {"ox":857,"oy":615,"number":148},
  {"ox":886,"oy":638,"number":149},
  {"ox":927,"oy":619,"number":150},
  {"ox":886,"oy":592,"number":151},
  {"ox":845,"oy":533,"number":152},
  {"ox":933,"oy":569,"number":153},
  {"ox":922,"oy":532,"number":154},
  {"ox":1017,"oy":603,"number":155},
  {"ox":1027,"oy":616,"number":156},
  {"ox":1007,"oy":617,"number":157},
  {"ox":1052,"oy":637,"number":158},
  {"ox":1017,"oy":657,"number":159},
  {"ox":1021,"oy":686,"number":160},
  {"ox":1043,"oy":694,"number":161},
  {"ox":992,"oy":744,"number":162},
  {"ox":1025,"oy":760,"number":163},
  {"ox":998,"oy":770,"number":164},
  {"ox":1012,"oy":781,"number":165},
  {"ox":998,"oy":796,"number":166},
  {"ox":983,"oy":821,"number":167},
  {"ox":1000,"oy":831,"number":168},
  {"ox":992,"oy":848,"number":169},
  {"ox":1094,"oy":766,"number":170},
  {"ox":1099,"oy":823,"number":171},
  {"ox":1105,"oy":792,"number":172},
  {"ox":1080,"oy":814,"number":173},
  {"ox":1057,"oy":568,"number":174},
  {"ox":1078,"oy":600,"number":175},
  {"ox":1087,"oy":617,"number":176},
  {"ox":1139,"oy":592,"number":177},
  {"ox":1137,"oy":552,"number":178},
  {"ox":1163,"oy":563,"number":179},
  {"ox":1095,"oy":547,"number":180},
  {"ox":1036,"oy":507,"number":181},
  {"ox":1040,"oy":493,"number":182},
  {"ox":1084,"oy":499,"number":183},
  {"ox":1129,"oy":521,"number":184},
  {"ox":1203,"oy":546,"number":185},
  {"ox":1239,"oy":583,"number":186},
  {"ox":1278,"oy":611,"number":187},
  {"ox":1252,"oy":612,"number":188},
  {"ox":1273,"oy":648,"number":189},
  {"ox":1017,"oy":471,"number":190},
  {"ox":990,"oy":463,"number":191},
  {"ox":970,"oy":432,"number":192},
  {"ox":975,"oy":470,"number":193},
  {"ox":952,"oy":444,"number":194},
  {"ox":943,"oy":451,"number":195},
  {"ox":933,"oy":457,"number":196},
  {"ox":920,"oy":472,"number":197},
  {"ox":922,"oy":450,"number":198},
  {"ox":915,"oy":439,"number":199},
  {"ox":916,"oy":427,"number":200},
  {"ox":912,"oy":410,"number":201},
  {"ox":894,"oy":412,"number":202},
  {"ox":883,"oy":402,"number":203},
  {"ox":865,"oy":424,"number":204},
  {"ox":856,"oy":441,"number":205},
  {"ox":841,"oy":454,"number":206},
  {"ox":816,"oy":478,"number":207},
  {"ox":799,"oy":462,"number":208},
  {"ox":802,"oy":427,"number":209},
  {"ox":823,"oy":447,"number":210},
  {"ox":835,"oy":428,"number":211},
  {"ox":844,"oy":415,"number":212},
  {"ox":824,"oy":393,"number":213},
  {"ox":858,"oy":385,"number":214},
  {"ox":858,"oy":385,"number":215},
  {"ox":859,"oy":370,"number":216},
  {"ox":888,"oy":369,"number":217},
  {"ox":875,"oy":354,"number":218},
  {"ox":900,"oy":343,"number":219},
  {"ox":919,"oy":356,"number":220},
  {"ox":924,"oy":376,"number":221},
  {"ox":929,"oy":393,"number":222},
  {"ox":942,"oy":388,"number":223},
  {"ox":953,"oy":398,"number":224},
  {"ox":985,"oy":421,"number":225},
  {"ox":1001,"oy":443,"number":226},
  {"ox":1021,"oy":455,"number":227},
  {"ox":1033,"oy":440,"number":228},
  {"ox":1067,"oy":440,"number":229},
  {"ox":1091,"oy":440,"number":230},
  {"ox":1107,"oy":444,"number":231},
  {"ox":1121,"oy":485,"number":232},
  {"ox":1153,"oy":513,"number":233},
  {"ox":1162,"oy":471,"number":234},
  {"ox":1133,"oy":440,"number":235},
  {"ox":1104,"oy":406,"number":236},
  {"ox":1013,"oy":405,"number":237},
  {"ox":1014,"oy":373,"number":238},
  {"ox":995,"oy":345,"number":239},
  {"ox":983,"oy":334,"number":240},
  {"ox":951,"oy":338,"number":241},
  {"ox":955,"oy":361,"number":242},
  {"ox":976,"oy":315,"number":243},
  {"ox":912,"oy":324,"number":244},
  {"ox":849,"oy":353,"number":245},
  {"ox":842,"oy":363,"number":246},
  {"ox":820,"oy":372,"number":247},
  {"ox":791,"oy":360,"number":248},
  {"ox":808,"oy":334,"number":249},
  {"ox":815,"oy":349,"number":250},
  {"ox":833,"oy":344,"number":251},
  {"ox":824,"oy":328,"number":252},
  {"ox":835,"oy":312,"number":253},
  {"ox":814,"oy":308,"number":254},
  {"ox":876,"oy":295,"number":255},
  {"ox":875,"oy":277,"number":256},
  {"ox":906,"oy":285,"number":257},
  {"ox":939,"oy":292,"number":258},
  {"ox":936,"oy":265,"number":259},
  {"ox":898,"oy":245,"number":260},
  {"ox":960,"oy":246,"number":261},
  {"ox":957,"oy":237,"number":262},
  {"ox":985,"oy":225,"number":263},
  {"ox":921,"oy":195,"number":264},
  {"ox":953,"oy":187,"number":265},
  {"ox":946,"oy":158,"number":266},
  {"ox":968,"oy":144,"number":267},
  {"ox":1022,"oy":170,"number":268},
  {"ox":1066,"oy":196,"number":269},
  {"ox":1042,"oy":205,"number":270},
  {"ox":971,"oy":265,"number":271},
  {"ox":963,"oy":277,"number":272},
  {"ox":980,"oy":281,"number":273},
  {"ox":978,"oy":289,"number":274},
  {"ox":1009,"oy":282,"number":275},
  {"ox":1032,"oy":265,"number":276},
  {"ox":1050,"oy":327,"number":277},
  {"ox":1059,"oy":336,"number":278},
  {"ox":1065,"oy":304,"number":279},
  {"ox":1056,"oy":361,"number":280},
  {"ox":1087,"oy":352,"number":281},
  {"ox":1046,"oy":414,"number":282},
  {"ox":1062,"oy":234,"number":283},
  {"ox":1124,"oy":184,"number":284},
  {"ox":1153,"oy":223,"number":285},
  {"ox":1145,"oy":249,"number":286},
  {"ox":1147,"oy":297,"number":287},
  {"ox":1169,"oy":317,"number":288},
  {"ox":1143,"oy":334,"number":289},
  {"ox":1158,"oy":367,"number":290},
  {"ox":1148,"oy":396,"number":291},
  {"ox":1213,"oy":441,"number":292},
  {"ox":1216,"oy":468,"number":293},
  {"ox":1216,"oy":493,"number":294},
  {"ox":1237,"oy":494,"number":295},
  {"ox":1252,"oy":509,"number":296},
  {"ox":1262,"oy":531,"number":297},
  {"ox":1301,"oy":533,"number":298},
  {"ox":1319,"oy":558,"number":299},
  {"ox":1323,"oy":534,"number":300},
  {"ox":1230,"oy":365,"number":301},
  {"ox":1238,"oy":333,"number":302},
  {"ox":1189,"oy":191,"number":303},
  {"ox":1248,"oy":246,"number":304},
  {"ox":1287,"oy":332,"number":305},
  {"ox":1345,"oy":327,"number":306},
  {"ox":1343,"oy":279,"number":307},
  {"ox":1318,"oy":166,"number":308},
  {"ox":1275,"oy":95,"number":309},
  {"ox":1401,"oy":4,"number":310},
  {"ox":1409,"oy":110,"number":311},
  {"ox":1537,"oy":125,"number":312},
  {"ox":1591,"oy":119,"number":313},
  {"ox":1477,"oy":243,"number":314},
  {"ox":1454,"oy":251,"number":315},
  {"ox":1489,"oy":280,"number":316},
  {"ox":1546,"oy":256,"number":317},
  {"ox":1652,"oy":284,"number":318},
  {"ox":1613,"oy":367,"number":319},
  {"ox":1600,"oy":434,"number":320},
  {"ox":1590,"oy":483,"number":321},
  {"ox":1569,"oy":488,"number":322},
  {"ox":1546,"oy":495,"number":323},
  {"ox":1531,"oy":474,"number":324},
  {"ox":1518,"oy":458,"number":325},
  {"ox":1519,"oy":409,"number":326},
  {"ox":1568,"oy":386,"number":327},
  {"ox":1528,"oy":359,"number":328},
  {"ox":1484,"oy":342,"number":329},
  {"ox":1403,"oy":356,"number":330},
  {"ox":1421,"oy":395,"number":331},
  {"ox":1320,"oy":422,"number":332},
  {"ox":1387,"oy":469,"number":333},
  {"ox":1469,"oy":457,"number":334},
  {"ox":1497,"oy":512,"number":335},
  {"ox":1479,"oy":505,"number":336},
  {"ox":1495,"oy":548,"number":337},
  {"ox":1458,"oy":565,"number":338},
  {"ox":1416,"oy":536,"number":339},
  {"ox":1416,"oy":517,"number":340},
  {"ox":1413,"oy":572,"number":341},
  {"ox":1393,"oy":583,"number":342},
  {"ox":1358,"oy":590,"number":343},
  {"ox":1384,"oy":611,"number":344},
  {"ox":1409,"oy":623,"number":345},
  {"ox":1392,"oy":668,"number":346},
  {"ox":1414,"oy":716,"number":347},
  {"ox":1458,"oy":708,"number":348},
  {"ox":1455,"oy":735,"number":349},
  {"ox":1515,"oy":626,"number":350},
  {"ox":1493,"oy":608,"number":351},
  {"ox":1518,"oy":726,"number":352},
  {"ox":1548,"oy":755,"number":353},
  {"ox":1477,"oy":799,"number":354},
  {"ox":1468,"oy":864,"number":355},
  {"ox":1498,"oy":865,"number":356},
  {"ox":1564,"oy":816,"number":357},
  {"ox":1595,"oy":803,"number":358},
  {"ox":1624,"oy":775,"number":359},
  {"ox":1632,"oy":736,"number":360},
  {"ox":1617,"oy":709,"number":361},
  {"ox":1650,"oy":812,"number":362},
  {"ox":1669,"oy":834,"number":363},
  {"ox":1584,"oy":871,"number":364},
  {"ox":1606,"oy":872,"number":365},
  {"ox":1655,"oy":875,"number":366},
  {"ox":1640,"oy":889,"number":367},
  {"ox":1624,"oy":902,"number":368},
  {"ox":1603,"oy":902,"number":369},
  {"ox":1630,"oy":939,"number":370},
  {"ox":1688,"oy":948,"number":371}

  ];

  // A particle object
  // this is not used at all if data is loaded from local storage, watch out!
  particle = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ox: 0,
    oy: 0,
    number: 0,
    dragged: false,
    links: [],
    links_alt: []
  }


  function load_source_data(){
    // //
    // Loading the particles from the array defined in the code
    //
    if(input_data){
      console.log("input data passed to the constructor, using it");
      particle_list = input_data;
    }else{
      console.log("no input data passed, using dataset backup");
      var n = source_data.length;
      i = n;
      while(i--){
        addParticle(source_data[i].ox,source_data[i].oy);
      }
    }
  }

  function addParticle(x,y){
    //adding a new particle (node)
    p = Object.create(particle);
    p.x = p.ox = x;
    p.y = p.oy = y;
    p.vx = (Math.random()-0.5)*2;
    p.vy = (Math.random()-0.5)*2;
    p.number = particle_list.length;
    p.links = [];
    p.links_alt = [];
    particle_list.push(p);
    return p;
  }

  function init(){
    ////////////////////////////////////////////
    //
    //           CANVAS GENERATION
    //
    // Create and attach canvas
    canvas = document.createElement( 'canvas' );
    document.body.appendChild(canvas);
    // Set canvas size to window size
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    // Get canvas context
    ctx = canvas.getContext( '2d' );
    //
    ////////////////////////////////////////////

    particle_list = [];

    // Generating random particles,
    // if the number is positive
    i = settings.PARTICLE_NUMBER;
    while (i--) {
      addParticle(Math.random()*w, Math.random()*h);
    }

    ////////////////////////////////////////////
    //
    //           HANDLING MOUSE EVENTS
    //
    window.addEventListener('mousemove',function(e){
      bounds = canvas.getBoundingClientRect();
      mx = e.clientX - bounds.left;
      my = e.clientY - bounds.top;
    });

    canvas.addEventListener('mousedown',function(e){
      if(hovered_particle){
        if(e.ctrlKey){
          console.log("Clicked with CTRL");
          hovered_particle.dragged = true;
        }
        if(e.shiftKey){
          console.log("Clicked with SHIFT");
          linked_particle = hovered_particle;
          linked_particle.being_linked = true;
          linked_particle_list.push(linked_particle);
        }
        if(e.metaKey){
          console.log("Clicked with META");
          linked_particle = hovered_particle;
          linked_particle.being_linked_alternatively = true;
          linked_particle_list.push(linked_particle);
        }

        if(!e.ctrlKey && !e.shiftKey && !e.metaKey){
          if(linked_particle_list && hovered_particle){
            //attach the links
            attach_links(linked_particle_list, hovered_particle);
          }else{
          }
        }
        mcn.target_node_number = hovered_particle.number;
        mcn.getNode();

      }else{
      }

    });
    canvas.addEventListener('mouseup',function(e){
      if(hovered_particle){
        hovered_particle.dragged = false;
      }else{
      }
    });

  }

  function attach_links(L,H){
    var i,n;
    i = n = L.length;
    while(i--){

      if(L[i].being_linked){
        L[i].links.push(H.number);
        L[i].being_linked = false;
      }

      if(L[i].being_linked_alternatively){
        L[i].links_alt.push(H.number);
        L[i].being_linked_alternatively = false;
      }

      console.log(L[i]);
      L.splice(i,1);

    }
    delete L;
  }

  function step(){
    var i;
    if(stats) stats.begin();
    ctx.clearRect(0,0,w,h);

    i = particle_list.length;
    previous_p = 0;
    while(i--){
      p = particle_list[i];


      // distance particle<->mouse given as a sum of squares
      // of differences between particle and mouse x and y coords
      // it's not square-rooted, because BRUSH_THICKNESS
      // is a square of the actual thickness
      // comparing squares much faster than square rooting.
      d = ( dx = mx - p.x ) * dx + ( dy = my - p.y ) * dy;

      f = settings.MOUSE_FORCE;
      if(f>10) f = 10;

      // follow the mouse forces
      //*
      if(settings.MOUSE_FORCE_ACTIVE){
        if ( d < settings.BRUSH_THICKNESS ) {
          t = Math.atan2( dy, dx );
          p.vx += f * Math.cos(t);
          p.vy += f * Math.sin(t);
        }
      }
      //*/
      if ( d < settings.MANIPULATOR_THICKNESS ){
        //current particle is hovered (mouse is nearby)
        if(p.hovered){//was hovered and still is hovered
        }else{//wasn't hovered, but is hovered now.
          p.hovered = true;
          hovered_particle = p;
        }

      }else{//outside of cursor influenece - not hovered now
        if(p.hovered){//was hovered before, but isn't now
          p.hovered = false;
          hovered_particle = null;
        }else{//wasn't hovered, isn't hovered

        }
      }

      if(p.dragged){
        p.ox = p.x = mx;
        p.oy = p.y = my;
        p.vx = p.vy = 0;
      }


      // distance from place of origin
      od = (odx = p.ox - p.x) * odx + (ody = p.oy - p.y) * ody;
      // force pulling a particle to the place of origin
      of = settings.ORIGIN_FORCE;


      /*
      if ( od < BRUSH_THICKNESS ) {
        ot = Math.atan2( ody, odx );
        p.vx += f * Math.cos(ot);
        p.vy += f * Math.sin(ot);
      }
      */



      //origin forces
      //*
      if(settings.ORIGIN_FORCE_ACTIVE){
        ot = Math.atan2( ody, odx );
        p.vx += of * Math.cos(ot);
        p.vy += of * Math.sin(ot);
      }
      //*/

      //Updating particle coordinates with their vectors
      p.x += p.vx;
      p.y += p.vy;

      //Bondaries checking
      if((p.x < 0) ||(p.x > w)){
        p.vx = -p.vx;
      }
      if((p.y < 0) || (p.y > h)){
        p.vy = -p.vy;
      }

      //Slowing down

      // Naive friction solution.
      // This slows down vx or vy when vx or vy is more than SPEED_MIN
      // But if the sum of vx and vy is more than SPEED_MIN (up to sqrt(2*SPEED_MIN)) it doesn't.
      // Essentially, this cuts the vector to fit within a square, not a circle with radius of SPEED_MIN;

      if (Math.abs(p.vx) >= settings.SPEED_MIN){
        p.vx = p.vx*(1-settings.FRICTION);
      }
      if (Math.abs(p.vy) >= settings.SPEED_MIN){
        p.vy = p.vy*(1-settings.FRICTION);
      }


      //var velocity_vector_value_squared = p.vx * p.vx + p.vy * p.vy;

      /*
      if ((Math.abs(p.vx) > 1) || (Math.abs(p.vy) > 1)){
        p.heat = p.heat * 1.02;
      }else{
        p.heat = p.heat * 0.98;
      }
      if(p.heat > 10) p.heat = 10;
      if(p.heat < 0.1) p.heat =  0.1;
      */


      //ctx.strokeStyle = 'rgba(255,255,255,1)';
      //ctx.beginPath();

      // link to place of origin
      //ctx.moveTo(p.x, p.y);
      //ctx.lineTo(p.ox,p.oy);
      //ctx.stroke();

      if(p.being_linked){
        ctx.strokeStyle = settings.colors.link.being_linked;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mx,my);
        ctx.stroke();
      }

      if(p.being_linked_alternatively){
        ctx.strokeStyle = settings.colors.link.being_linked_alt;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mx,my);
        ctx.stroke();
      }



      if(p.links){//drawing primary links
        var n = 0;
        k = n = p.links.length;
        ctx.strokeStyle = settings.colors.link.regular;//;
        while(k--){
          var other_side;
          other_side = particle_list[p.links[k]];
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other_side.x, other_side.y);
          ctx.stroke();
        }
      }

      // Drawing alternative links
      if(p.links_alt){
        var n = 0;
        k = n = p.links_alt.length;
        ctx.strokeStyle = settings.colors.link.alternative;
        while(k--){
          var other_side;
          other_side = particle_list[p.links_alt[k]]
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other_side.x, other_side.y);
          ctx.stroke();
        }
      }

      ////
      // DRAWING A CIRCLE
      var radius = settings.node_radius;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = settings.colors.node.fill;
      ctx.fill();
      ctx.lineWidth = 1;
      //ctx.strokeStyle = 'rgba(255,0,0,' + (0.2 + p.heat) + ')';
      if(p.being_linked_alternatively){
        ctx.strokeStyle = settings.colors.node.being_linked_alt;//'rgba(200,200,200,1)';
      }else if(p.being_linked){
        ctx.strokeStyle = settings.colors.node.being_linked;
      }else if(p.hovered){
        ctx.strokeStyle = settings.colors.node.hovered;
      }else{
        ctx.strokeStyle = settings.colors.node.regular;
      }
      ctx.stroke();


			if(mcn.display_numbers){
      	ctx.strokeText(p.number, p.x + 2, p.y-2);
      }



    }//end of while(i--)
    if(stats) stats.end();
    requestAnimationFrame(step);
  }//end of step()

  init();
  load_source_data();
  step();

};//end of the particleDrivenMap object

//var primaryWorldMap = new particleDrivenMap(input_data_array);


//THIS IS A DATA DUMP OF THE FINAL VERSION OF THE MAP. HOURS OF MANUAL LABOR /o\
var input_data_array = [{"ox":51,"x":51,"oy":149,"y":149,"number":0,"links":[1,371,374],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[376],"being_linked_alternatively":false},{"ox":66,"x":66,"oy":181,"y":181,"number":1,"links":[5,6,8,371,372,373],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[3,376],"being_linked_alternatively":false},{"ox":54,"x":54,"oy":224,"y":224,"number":2,"links":[8,9,5,371,372,374],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[12,375],"being_linked_alternatively":false},{"ox":43,"x":43,"oy":268,"y":268,"number":3,"links":[2,4,372,374,376],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":63,"x":63,"oy":276,"y":276,"number":4,"links":[1,6],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[2,0],"being_linked_alternatively":false},{"ox":127,"x":127,"oy":172,"y":172,"number":5,"links":[8,6,7,0],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[12,57],"being_linked_alternatively":false},{"ox":131,"x":131,"oy":316,"y":316,"number":6,"links":[8,12,10],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[2],"being_linked_alternatively":false},{"ox":173,"x":173,"oy":119,"y":119,"number":7,"links":[8,9],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":166,"x":166,"oy":219,"y":219,"number":8,"links":[4,11,0,372],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":190,"x":190,"oy":295,"y":295,"number":9,"links":[12,1,54],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":155,"x":155,"oy":341,"y":341,"number":10,"links":[9,14,56,37,8],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":264,"x":264,"oy":199,"y":199,"number":11,"links":[7,54,57,5],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":231,"x":231,"oy":252,"y":252,"number":12,"links":[8,55,11,13,4,7],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":237,"x":237,"oy":345,"y":345,"number":13,"links":[9,10,57,24,48,23],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[37,11,6],"being_linked_alternatively":false},{"ox":185,"x":185,"oy":381,"y":381,"number":14,"links":[15,13],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":190,"x":190,"oy":394,"y":394,"number":15,"links":[16,38],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[13],"being_linked_alternatively":false},{"ox":188,"x":188,"oy":409,"y":409,"number":16,"links":[],"vx":0,"vy":0,"hovered":false,"dragged":false,"links_alt":[18,24],"being_linked_alternatively":false},{"ox":188,"x":188,"oy":465,"y":465,"number":17,"links":[16,18,22],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":209,"x":209,"oy":491,"y":491,"number":18,"links":[19,23,22],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[25],"being_linked_alternatively":false},{"ox":249,"x":249,"oy":521,"y":521,"number":19,"links":[21,20,26,27],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[31,30,28,24],"being_linked_alternatively":false},{"ox":270,"x":270,"oy":547,"y":547,"number":20,"links":[27,26,30],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[70],"being_linked_alternatively":false},{"ox":245,"x":245,"oy":495,"y":495,"number":21,"links":[18,16],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":247,"x":247,"oy":443,"y":443,"number":22,"links":[21,23,24,25,26],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":222,"x":222,"oy":426,"y":426,"number":23,"links":[8,16,15,14,24,17],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":267,"x":267,"oy":407,"y":407,"number":24,"links":[15,14,38,37,31,30,25,26],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[36],"being_linked_alternatively":false},{"ox":282,"x":282,"oy":453,"y":453,"number":25,"links":[31,30],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[15],"being_linked_alternatively":false},{"ox":272,"x":272,"oy":483,"y":483,"number":26,"links":[30,25,21,27,37],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":317,"x":317,"oy":519,"y":519,"number":27,"links":[28],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":312,"x":312,"oy":578,"y":578,"number":28,"links":[20,70],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":334,"x":334,"oy":517,"y":517,"number":29,"links":[34,27,28,32,30],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":324,"x":324,"oy":497,"y":497,"number":30,"links":[27,34],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":336,"x":336,"oy":455,"y":455,"number":31,"links":[30,34,26,36,37,38],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":362,"x":362,"oy":484,"y":484,"number":32,"links":[30,31,34,36,35,39],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[49],"being_linked_alternatively":false},{"ox":415,"x":415,"oy":541,"y":541,"number":33,"links":[35,32],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":407,"x":407,"oy":513,"y":513,"number":34,"links":[33,43],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":412,"x":412,"oy":483,"y":483,"number":35,"links":[34,39],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[31],"being_linked_alternatively":false},{"ox":375,"x":375,"oy":437,"y":437,"number":36,"links":[35,40,41,39,37],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[44],"being_linked_alternatively":false},{"ox":345,"x":345,"oy":414,"y":414,"number":37,"links":[48,56,55,25,39,44,49],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[50,54],"being_linked_alternatively":false},{"ox":286,"x":286,"oy":372,"y":372,"number":38,"links":[56,48,13,37,8],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":398,"x":398,"oy":434,"y":434,"number":39,"links":[40,42,41,44,48],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":433,"x":433,"oy":459,"y":459,"number":40,"links":[41,35,212],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":443,"x":443,"oy":451,"y":451,"number":41,"links":[],"vx":0,"vy":0,"hovered":false,"dragged":false,"links_alt":[]},{"ox":447,"x":447,"oy":445,"y":445,"number":42,"links":[41],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":463,"x":463,"oy":431,"y":431,"number":43,"links":[42,207],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[215],"being_linked_alternatively":false},{"ox":440,"x":440,"oy":413,"y":413,"number":44,"links":[43,42,35],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":450,"x":450,"oy":410,"y":410,"number":45,"links":[43,47],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":505,"x":505,"oy":417,"y":417,"number":46,"links":[43,121],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[45],"being_linked_alternatively":false},{"ox":477,"x":477,"oy":389,"y":389,"number":47,"links":[46,48,49,43],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":408,"x":408,"oy":365,"y":365,"number":48,"links":[53,44,45,51],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[36,31],"being_linked_alternatively":false},{"ox":484,"x":484,"oy":349,"y":349,"number":49,"links":[53,51,50,48,39],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[45],"being_linked_alternatively":false},{"ox":531,"x":531,"oy":335,"y":335,"number":50,"links":[47,63],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":476,"x":476,"oy":300,"y":300,"number":51,"links":[50,52,53],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":477,"x":477,"oy":238,"y":238,"number":52,"links":[50],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[48],"being_linked_alternatively":false},{"ox":427,"x":427,"oy":255,"y":255,"number":53,"links":[54,52],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[50,37,45],"being_linked_alternatively":false},{"ox":350,"x":350,"oy":248,"y":248,"number":54,"links":[10,12],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[13],"being_linked_alternatively":false},{"ox":341,"x":341,"oy":295,"y":295,"number":55,"links":[56,54,48],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[36],"being_linked_alternatively":false},{"ox":321,"x":321,"oy":323,"y":323,"number":56,"links":[13,11,9,48],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[7],"being_linked_alternatively":false},{"ox":347,"x":347,"oy":160,"y":160,"number":57,"links":[54,7,58],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":475,"x":475,"oy":34,"y":34,"number":58,"links":[59],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":552,"x":552,"oy":120,"y":120,"number":59,"links":[60],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":726,"x":726,"oy":145,"y":145,"number":60,"links":[64],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":573,"x":573,"oy":194,"y":194,"number":61,"links":[62,60,64,59],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":566,"x":566,"oy":233,"y":233,"number":62,"links":[63,60,64],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[59],"being_linked_alternatively":false},{"ox":588,"x":588,"oy":270,"y":270,"number":63,"links":[64,59],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":644,"x":644,"oy":211,"y":211,"number":64,"links":[59,65],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":721,"x":721,"oy":213,"y":213,"number":65,"links":[68,66,67],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":748,"x":748,"oy":217,"y":217,"number":66,"links":[],"vx":0,"vy":0,"hovered":false,"dragged":false,"links_alt":[]},{"ox":747,"x":747,"oy":205,"y":205,"number":67,"links":[66],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":727,"x":727,"oy":232,"y":232,"number":68,"links":[67,66],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":353,"x":353,"oy":608,"y":608,"number":69,"links":[28,70],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":394,"x":394,"oy":600,"y":600,"number":70,"links":[71],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":399,"x":399,"oy":631,"y":631,"number":71,"links":[69,74],"vx":0,"vy":0,"hovered":false,"dragged":false,"being_linked":false,"links_alt":[]},{"ox":487,"x":487,"oy":628,"y":628,"number":72,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":463,"x":463,"oy":638,"y":638,"number":73,"links":[72,105,106,104],"vx":0,"vy":0,"links_alt":[109,103],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":441,"x":441,"oy":651,"y":651,"number":74,"links":[73,76,106],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":446,"x":446,"oy":658,"y":658,"number":75,"links":[108,105,82,74,76,73],"vx":0,"vy":0,"hovered":false,"links_alt":[83],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":434,"x":434,"oy":666,"y":666,"number":76,"links":[77,105],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":424,"x":424,"oy":685,"y":685,"number":77,"links":[78,105,106,104,82],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":417,"x":417,"oy":694,"y":694,"number":78,"links":[79,81],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":420,"x":420,"oy":725,"y":725,"number":79,"links":[80],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":431,"x":431,"oy":748,"y":748,"number":80,"links":[81],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":439,"x":439,"oy":757,"y":757,"number":81,"links":[83,104],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":445,"x":445,"oy":727,"y":727,"number":82,"links":[105,106,104,78,76,79,80],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":479,"x":479,"oy":771,"y":771,"number":83,"links":[85,84,104,82,79,86],"vx":0,"vy":0,"links_alt":[110,377],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":496,"x":496,"oy":785,"y":785,"number":84,"links":[97,98,104,85],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":494,"x":494,"oy":819,"y":819,"number":85,"links":[92,96],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":465,"x":465,"oy":870,"y":870,"number":86,"links":[87,92,85],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":457,"x":457,"oy":907,"y":907,"number":87,"links":[88],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":453,"x":453,"oy":919,"y":919,"number":88,"links":[89,378,380],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":463,"x":463,"oy":922,"y":922,"number":89,"links":[90,378],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":495,"x":495,"oy":939,"y":939,"number":90,"links":[91,93,95,94],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":482,"x":482,"oy":903,"y":903,"number":91,"links":[87,88,89,86,92,93,94,377],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":502,"x":502,"oy":857,"y":857,"number":92,"links":[93,87],"vx":0,"vy":0,"links_alt":[88],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":519,"x":519,"oy":868,"y":868,"number":93,"links":[94,96],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":531,"x":531,"oy":880,"y":880,"number":94,"links":[95,96],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":542,"x":542,"oy":881,"y":881,"number":95,"links":[85,96],"vx":0,"vy":0,"links_alt":[88,377],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":570,"x":570,"oy":850,"y":850,"number":96,"links":[97,98,99],"vx":0,"vy":0,"links_alt":[92],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":537,"x":537,"oy":820,"y":820,"number":97,"links":[92,102,94],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":571,"x":571,"oy":809,"y":809,"number":98,"links":[102,97,101,113,109],"vx":0,"vy":0,"links_alt":[110,92],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":595,"x":595,"oy":812,"y":812,"number":99,"links":[98],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":612,"x":612,"oy":808,"y":808,"number":100,"links":[99,114],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":609,"x":609,"oy":790,"y":790,"number":101,"links":[114,100],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":587,"x":587,"oy":767,"y":767,"number":102,"links":[103,99,100],"vx":0,"vy":0,"hovered":false,"links_alt":[96,82],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":546,"x":546,"oy":768,"y":768,"number":103,"links":[97,85,98,104,111,82,83],"vx":0,"vy":0,"links_alt":[92],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":502,"x":502,"oy":728,"y":728,"number":104,"links":[110,105,111,113],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":525,"x":525,"oy":699,"y":699,"number":105,"links":[103,107,109,110],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":533,"x":533,"oy":648,"y":648,"number":106,"links":[72,105,109],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":547,"x":547,"oy":653,"y":653,"number":107,"links":[109,106],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":565,"x":565,"oy":655,"y":655,"number":108,"links":[107,109,105],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":568,"x":568,"oy":682,"y":682,"number":109,"links":[84,110],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":586,"x":586,"oy":691,"y":691,"number":110,"links":[108,103,101,102],"vx":0,"vy":0,"hovered":false,"links_alt":[82],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":616,"x":616,"oy":711,"y":711,"number":111,"links":[102,110,112,113],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":653,"x":653,"oy":713,"y":713,"number":112,"links":[110,102,115],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":656,"x":656,"oy":726,"y":726,"number":113,"links":[112,103],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":639,"x":639,"oy":752,"y":752,"number":114,"links":[113,111,102],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":785,"x":785,"oy":651,"y":651,"number":115,"links":[],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false},{"ox":916,"x":916,"oy":496,"y":496,"number":116,"links":[126,124,153,154],"vx":0,"vy":0,"hovered":false,"links_alt":[151,156],"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":772,"x":772,"oy":632,"y":632,"number":117,"links":[118],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":752,"x":752,"oy":604,"y":604,"number":118,"links":[119],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":758,"x":758,"oy":584,"y":584,"number":119,"links":[121],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":783,"x":783,"oy":591,"y":591,"number":120,"links":[118,119,121,150,127,115],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":772,"x":772,"oy":534,"y":534,"number":121,"links":[123,145],"vx":0,"vy":0,"hovered":false,"links_alt":[150],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":794,"x":794,"oy":503,"y":503,"number":122,"links":[121,120],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":807,"x":807,"oy":513,"y":513,"number":123,"links":[124,122,125],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":809,"x":809,"oy":490,"y":490,"number":124,"links":[122],"vx":0,"vy":0,"hovered":false,"links_alt":[152],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":860,"x":860,"oy":473,"y":473,"number":125,"links":[124,153,150],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":897,"x":897,"oy":472,"y":472,"number":126,"links":[125,150],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":842,"x":842,"oy":530,"y":530,"number":127,"links":[124,123,121,119,147,125,116],"vx":0,"vy":0,"links_alt":[148],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1005,"x":1005,"oy":508,"y":508,"number":128,"links":[116],"vx":0,"vy":0,"links_alt":[170],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1011,"x":1011,"oy":517,"y":517,"number":129,"links":[153,152,128,156,180],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1087,"x":1087,"oy":672,"y":672,"number":130,"links":[129,157],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1055,"x":1055,"oy":719,"y":719,"number":131,"links":[130,160,132],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1019,"x":1019,"oy":825,"y":825,"number":132,"links":[164,165,167],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":994,"x":994,"oy":868,"y":868,"number":133,"links":[168,132],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":981,"x":981,"oy":876,"y":876,"number":134,"links":[168,133],"vx":0,"vy":0,"links_alt":[131,166],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":943,"x":943,"oy":875,"y":875,"number":135,"links":[166,134],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":937,"x":937,"oy":806,"y":806,"number":136,"links":[161,163,165,166,134,135],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":915,"x":915,"oy":727,"y":727,"number":137,"links":[138,140,139,131],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":925,"x":925,"oy":722,"y":722,"number":138,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":926,"x":926,"oy":703,"y":703,"number":139,"links":[138,141,170],"vx":0,"vy":0,"hovered":false,"links_alt":[152],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":894,"x":894,"oy":680,"y":680,"number":140,"links":[139],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":906,"x":906,"oy":662,"y":662,"number":141,"links":[143,148,149,140],"vx":0,"vy":0,"hovered":false,"links_alt":[152,157],"being_linked":false,"dragged":false,"being_linked_alternatively":false},{"ox":851,"x":851,"oy":653,"y":653,"number":142,"links":[145,147],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":858,"x":858,"oy":647,"y":647,"number":143,"links":[142,147],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":842,"x":842,"oy":654,"y":654,"number":144,"links":[142,115,118,146,145],"vx":0,"vy":0,"hovered":false,"links_alt":[151,127],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":835,"x":835,"oy":614,"y":614,"number":145,"links":[147,115,151,146],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":800,"x":800,"oy":616,"y":616,"number":146,"links":[117,118,120,127],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":857,"x":857,"oy":613,"y":613,"number":147,"links":[148,150],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":886,"x":886,"oy":635,"y":635,"number":148,"links":[143],"vx":0,"vy":0,"hovered":false,"links_alt":[153],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":922,"x":922,"oy":617,"y":617,"number":149,"links":[148,152,139],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":886,"x":886,"oy":589,"y":589,"number":150,"links":[149,170,148,153],"vx":0,"vy":0,"hovered":false,"links_alt":[124],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":777,"x":777,"oy":640,"y":640,"number":151,"links":[115,117],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":932,"x":932,"oy":567,"y":567,"number":152,"links":[128,153,156,150],"vx":0,"vy":0,"hovered":false,"links_alt":[162],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":922,"x":922,"oy":532,"y":532,"number":153,"links":[128,127,120],"vx":0,"vy":0,"hovered":false,"links_alt":[170],"being_linked":false,"dragged":false,"being_linked_alternatively":false},{"ox":1018,"x":1018,"oy":599,"y":599,"number":154,"links":[129,152,155],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1026,"x":1026,"oy":613,"y":613,"number":155,"links":[174],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1006,"x":1006,"oy":613,"y":613,"number":156,"links":[155,154,158,170,161],"vx":0,"vy":0,"links_alt":[137],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1052,"x":1052,"oy":635,"y":635,"number":157,"links":[174,155,156,160],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1016,"x":1016,"oy":657,"y":657,"number":158,"links":[155,157,159,139],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1020,"x":1020,"oy":681,"y":681,"number":159,"links":[160,138],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1042,"x":1042,"oy":690,"y":690,"number":160,"links":[158],"vx":0,"vy":0,"links_alt":[174,137],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":991,"x":991,"oy":744,"y":744,"number":161,"links":[138,139,172,159,163,131],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1024,"x":1024,"oy":757,"y":757,"number":162,"links":[131],"vx":0,"vy":0,"links_alt":[157],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":996,"x":996,"oy":765,"y":765,"number":163,"links":[162,164,165,160],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1012,"x":1012,"oy":779,"y":779,"number":164,"links":[162,165],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":997,"x":997,"oy":792,"y":792,"number":165,"links":[169],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":983,"x":983,"oy":817,"y":817,"number":166,"links":[168,165,164],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":997,"x":997,"oy":824,"y":824,"number":167,"links":[166],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":991,"x":991,"oy":847,"y":847,"number":168,"links":[167,136,132],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":925,"x":925,"oy":771,"y":771,"number":169,"links":[136,138,161,163],"vx":0,"vy":0,"links_alt":[166],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":944,"x":944,"oy":660,"y":660,"number":170,"links":[161,129,141,159,152],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1094,"x":1094,"oy":765,"y":765,"number":171,"links":[385,383,162],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":917,"x":917,"oy":749,"y":749,"number":172,"links":[137,169,159],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1056,"x":1056,"oy":565,"y":565,"number":173,"links":[182,179],"vx":0,"vy":0,"links_alt":[178,181],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1076,"x":1076,"oy":597,"y":597,"number":174,"links":[173],"vx":0,"vy":0,"links_alt":[182],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1086,"x":1086,"oy":613,"y":613,"number":175,"links":[176,174,179],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1135,"x":1135,"oy":589,"y":589,"number":176,"links":[173],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1137,"x":1137,"oy":552,"y":552,"number":177,"links":[178,176,174],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1162,"x":1162,"oy":562,"y":562,"number":178,"links":[176],"vx":0,"vy":0,"links_alt":[174],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1095,"x":1095,"oy":545,"y":545,"number":179,"links":[177,178,176,174,180],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1036,"x":1036,"oy":505,"y":505,"number":180,"links":[173,181],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1038,"x":1038,"oy":491,"y":491,"number":181,"links":[182,227],"vx":0,"vy":0,"links_alt":[128],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":1082,"x":1082,"oy":497,"y":497,"number":182,"links":[183,179,180],"vx":0,"vy":0,"links_alt":[184],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1125,"x":1125,"oy":519,"y":519,"number":183,"links":[184,234],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1201,"x":1201,"oy":545,"y":545,"number":184,"links":[185,231,293,233],"vx":0,"vy":0,"links_alt":[235],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1238,"x":1238,"oy":581,"y":581,"number":185,"links":[186,187,293],"vx":0,"vy":0,"links_alt":[331],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1277,"x":1277,"oy":609,"y":609,"number":186,"links":[298,188,296],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1254,"x":1254,"oy":611,"y":611,"number":187,"links":[296],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1272,"x":1272,"oy":646,"y":646,"number":188,"links":[187,296],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1015,"x":1015,"oy":470,"y":470,"number":189,"links":[181,226,190],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":990,"x":990,"oy":460,"y":460,"number":190,"links":[225,191],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":969,"x":969,"oy":433,"y":433,"number":191,"links":[224,225,223,241],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":972,"x":972,"oy":467,"y":467,"number":192,"links":[191,193],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":950,"x":950,"oy":442,"y":442,"number":193,"links":[200,221,237,191,224],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":941,"x":941,"oy":448,"y":448,"number":194,"links":[197,199],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":932,"x":932,"oy":456,"y":456,"number":195,"links":[196],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":922,"x":922,"oy":471,"y":471,"number":196,"links":[194],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":921,"x":921,"oy":448,"y":448,"number":197,"links":[195],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":912,"x":912,"oy":437,"y":437,"number":198,"links":[197,194,199,200],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":915,"x":915,"oy":425,"y":425,"number":199,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":910,"x":910,"oy":410,"y":410,"number":200,"links":[197,195,201,202,191,223,221],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":894,"x":894,"oy":411,"y":411,"number":201,"links":[198,199],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":882,"x":882,"oy":400,"y":400,"number":202,"links":[212,201],"vx":0,"vy":0,"links_alt":[207,215],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":865,"x":865,"oy":422,"y":422,"number":203,"links":[212,202,201],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":856,"x":856,"oy":441,"y":441,"number":204,"links":[208,203],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":839,"x":839,"oy":453,"y":453,"number":205,"links":[211,204],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":815,"x":815,"oy":475,"y":475,"number":206,"links":[209,124,205],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":796,"x":796,"oy":460,"y":460,"number":207,"links":[205,206,209,210],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":802,"x":802,"oy":427,"y":427,"number":208,"links":[209,207],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":823,"x":823,"oy":447,"y":447,"number":209,"links":[205,204,210],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":834,"x":834,"oy":427,"y":427,"number":210,"links":[204,205,208],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":842,"x":842,"oy":414,"y":414,"number":211,"links":[212,204,203,210,202,216],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":821,"x":821,"oy":390,"y":390,"number":212,"links":[42],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1680,"x":1680,"oy":313,"y":313,"number":213,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":856,"x":856,"oy":382,"y":382,"number":214,"links":[212,203,204,221,215,216,220,202],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":856,"x":856,"oy":369,"y":369,"number":215,"links":[217,212,216,220],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":883,"x":883,"oy":367,"y":367,"number":216,"links":[218,202,200],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":871,"x":871,"oy":352,"y":352,"number":217,"links":[218,216,220],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":896,"x":896,"oy":342,"y":342,"number":218,"links":[243,220,201],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":918,"x":918,"oy":354,"y":354,"number":219,"links":[216,220,241,240,218],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":921,"x":921,"oy":374,"y":374,"number":220,"links":[216,202,200,221,222,237,241,240],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":929,"x":929,"oy":391,"y":391,"number":221,"links":[222,223],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":939,"x":939,"oy":387,"y":387,"number":222,"links":[237,241],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":946,"x":946,"oy":394,"y":394,"number":223,"links":[193,224],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":984,"x":984,"oy":419,"y":419,"number":224,"links":[190,236],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1001,"x":1001,"oy":443,"y":443,"number":225,"links":[189,226,224,193],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1020,"x":1020,"oy":454,"y":454,"number":226,"links":[181,227,190],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":1032,"x":1032,"oy":438,"y":438,"number":227,"links":[228,182,225],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1067,"x":1067,"oy":438,"y":438,"number":228,"links":[182,229,181,189,183],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1087,"x":1087,"oy":441,"y":441,"number":229,"links":[182,230,181,279,235],"vx":0,"vy":0,"links_alt":[291],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1109,"x":1109,"oy":446,"y":446,"number":230,"links":[182,231,189,181],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1121,"x":1121,"oy":483,"y":483,"number":231,"links":[183,182,181,234,233,229,226],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1148,"x":1148,"oy":514,"y":514,"number":232,"links":[298,184,233],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1158,"x":1158,"oy":468,"y":468,"number":233,"links":[292,183,290],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1131,"x":1131,"oy":436,"y":436,"number":234,"links":[233,290,288],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1104,"x":1104,"oy":406,"y":406,"number":235,"links":[290,230,234],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1010,"x":1010,"oy":402,"y":402,"number":236,"links":[235,281,289,279,223],"vx":0,"vy":0,"links_alt":[275,276],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1008,"x":1008,"oy":372,"y":372,"number":237,"links":[238,236,276,275,274,223,224],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":994,"x":994,"oy":344,"y":344,"number":238,"links":[276,274,223],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":979,"x":979,"oy":334,"y":334,"number":239,"links":[238,276,274,236],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":951,"x":951,"oy":336,"y":336,"number":240,"links":[241,239,242],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":956,"x":956,"oy":356,"y":356,"number":241,"links":[237,223,239,238,236],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":975,"x":975,"oy":311,"y":311,"number":242,"links":[276,274,239],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":912,"x":912,"oy":324,"y":324,"number":243,"links":[240,219],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":847,"x":847,"oy":352,"y":352,"number":244,"links":[252,253,250],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":842,"x":842,"oy":362,"y":362,"number":245,"links":[244,215],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":819,"x":819,"oy":370,"y":370,"number":246,"links":[251,249,245],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":791,"x":791,"oy":358,"y":358,"number":247,"links":[249],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":803,"x":803,"oy":332,"y":332,"number":248,"links":[247],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":811,"x":811,"oy":347,"y":347,"number":249,"links":[248,245],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":832,"x":832,"oy":342,"y":342,"number":250,"links":[251,245,249,246],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":821,"x":821,"oy":325,"y":325,"number":251,"links":[248,252,244],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":831,"x":831,"oy":312,"y":312,"number":252,"links":[66,250],"vx":0,"vy":0,"hovered":false,"being_linked":false,"dragged":false,"links_alt":[]},{"ox":814,"x":814,"oy":306,"y":306,"number":253,"links":[252,251],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":874,"x":874,"oy":292,"y":292,"number":254,"links":[252,256],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":873,"x":873,"oy":277,"y":277,"number":255,"links":[254,256,258],"vx":0,"vy":0,"hovered":false,"links_alt":[261],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":902,"x":902,"oy":282,"y":282,"number":256,"links":[258,243],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":940,"x":940,"oy":290,"y":290,"number":257,"links":[256,258,243],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":934,"x":934,"oy":264,"y":264,"number":258,"links":[243],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":899,"x":899,"oy":244,"y":244,"number":259,"links":[255,256,258,257,254],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":958,"x":958,"oy":245,"y":245,"number":260,"links":[270,262],"vx":0,"vy":0,"links_alt":[274],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":955,"x":955,"oy":236,"y":236,"number":261,"links":[263,259,258,256],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":981,"x":981,"oy":223,"y":223,"number":262,"links":[270,282,269,267,264,263,261],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":920,"x":920,"oy":195,"y":195,"number":263,"links":[259,264,258],"vx":0,"vy":0,"hovered":false,"links_alt":[269],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":953,"x":953,"oy":185,"y":185,"number":264,"links":[269,267,256,261],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":945,"x":945,"oy":157,"y":157,"number":265,"links":[263,264],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":971,"x":971,"oy":143,"y":143,"number":266,"links":[265,264,262],"vx":0,"vy":0,"hovered":false,"links_alt":[274],"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1020,"x":1020,"oy":170,"y":170,"number":267,"links":[266,269,265],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1063,"x":1063,"oy":194,"y":194,"number":268,"links":[267,264],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1045,"x":1045,"oy":204,"y":204,"number":269,"links":[268,270],"vx":0,"vy":0,"links_alt":[266],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":970,"x":970,"oy":263,"y":263,"number":270,"links":[282,272],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":960,"x":960,"oy":273,"y":273,"number":271,"links":[272,260,270],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":979,"x":979,"oy":279,"y":279,"number":272,"links":[274,275],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":977,"x":977,"oy":288,"y":288,"number":273,"links":[274,242],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1008,"x":1008,"oy":281,"y":281,"number":274,"links":[276],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1028,"x":1028,"oy":263,"y":263,"number":275,"links":[274,270,282,262,266],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1047,"x":1047,"oy":325,"y":325,"number":276,"links":[277,279,286,278,275,282,273],"vx":0,"vy":0,"links_alt":[202],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1058,"x":1058,"oy":334,"y":334,"number":277,"links":[279,286,285,278],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1064,"x":1064,"oy":303,"y":303,"number":278,"links":[289,286,284,275,269,274],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1055,"x":1055,"oy":360,"y":360,"number":279,"links":[239,235,281,237,280],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1086,"x":1086,"oy":348,"y":348,"number":280,"links":[235,289,277,278,285,286],"vx":0,"vy":0,"links_alt":[229],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1044,"x":1044,"oy":414,"y":414,"number":281,"links":[235,228,229,280,276],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1059,"x":1059,"oy":231,"y":231,"number":282,"links":[269,286,302,278],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1123,"x":1123,"oy":183,"y":183,"number":283,"links":[282,307,235,278],"vx":0,"vy":0,"links_alt":[386,310,285,280],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1151,"x":1151,"oy":220,"y":220,"number":284,"links":[302,283,282],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1145,"x":1145,"oy":249,"y":249,"number":285,"links":[307,301,286,278,284,282],"vx":0,"vy":0,"links_alt":[304,275],"hovered":false,"being_linked":false,"dragged":false,"being_linked_alternatively":false},{"ox":1147,"x":1147,"oy":297,"y":297,"number":286,"links":[287,288],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1169,"x":1169,"oy":314,"y":314,"number":287,"links":[284,300,288],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1143,"x":1143,"oy":334,"y":334,"number":288,"links":[300,290,235,236,276],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1156,"x":1156,"oy":364,"y":364,"number":289,"links":[300,287,284,235],"vx":0,"vy":0,"links_alt":[293],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1148,"x":1148,"oy":394,"y":394,"number":290,"links":[390,300,289,279],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1213,"x":1213,"oy":441,"y":441,"number":291,"links":[390,300,290,287],"vx":0,"vy":0,"links_alt":[235],"hovered":false,"being_linked":false,"dragged":false,"being_linked_alternatively":false},{"ox":1213,"x":1213,"oy":465,"y":465,"number":292,"links":[390,291,290],"vx":0,"vy":0,"links_alt":[285],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1216,"x":1216,"oy":491,"y":491,"number":293,"links":[296,294,390,292,232,233],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1237,"x":1237,"oy":492,"y":492,"number":294,"links":[295,292],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1251,"x":1251,"oy":508,"y":508,"number":295,"links":[332,331,297,293,390,296],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1258,"x":1258,"oy":525,"y":525,"number":296,"links":[298,184,185,232],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1301,"x":1301,"oy":532,"y":532,"number":297,"links":[331,332,299,298,185,296,390],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1315,"x":1315,"oy":557,"y":557,"number":298,"links":[299,342,185,187],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1323,"x":1323,"oy":532,"y":532,"number":299,"links":[331,340,185],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1226,"x":1226,"oy":362,"y":362,"number":300,"links":[301],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1236,"x":1236,"oy":332,"y":332,"number":301,"links":[390,289,302,287,233],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1187,"x":1187,"oy":189,"y":189,"number":302,"links":[307,303,283,287],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1251,"x":1251,"oy":246,"y":246,"number":303,"links":[308,307,305,284,286,287,289,285],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1287,"x":1287,"oy":332,"y":332,"number":304,"links":[330,307,303,305,331,301,284,295,390],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1341,"x":1341,"oy":323,"y":323,"number":305,"links":[315,313,307,285,331],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1341,"x":1341,"oy":277,"y":277,"number":306,"links":[315,311,308,307,303,305],"vx":0,"vy":0,"links_alt":[312],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":1315,"x":1315,"oy":163,"y":163,"number":307,"links":[308,307,301],"vx":0,"vy":0,"links_alt":[386,329],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":1273,"x":1273,"oy":92,"y":92,"number":308,"links":[283,312,302],"vx":0,"vy":0,"hovered":false,"links_alt":[],"dragged":false,"being_linked":false},{"ox":1401,"x":1401,"oy":4,"y":4,"number":309,"links":[311,308,310,314,307],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1407,"x":1407,"oy":110,"y":110,"number":310,"links":[308,306,307],"vx":0,"vy":0,"links_alt":[316,304],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1534,"x":1534,"oy":124,"y":124,"number":311,"links":[312,386,310,314,307],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1589,"x":1589,"oy":119,"y":119,"number":312,"links":[386,313],"vx":0,"vy":0,"links_alt":[318],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1475,"x":1475,"oy":243,"y":243,"number":313,"links":[386,316,314,310,303,307],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1454,"x":1454,"oy":251,"y":251,"number":314,"links":[315,306,310,308],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1487,"x":1487,"oy":278,"y":278,"number":315,"links":[317],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1541,"x":1541,"oy":255,"y":255,"number":316,"links":[386,388,389,317,318,312,311],"vx":0,"vy":0,"links_alt":[387],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1648,"x":1648,"oy":283,"y":283,"number":317,"links":[388,389],"vx":0,"vy":0,"links_alt":[387],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":1609,"x":1609,"oy":364,"y":364,"number":318,"links":[317,319,327],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1599,"x":1599,"oy":432,"y":432,"number":319,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":1589,"x":1589,"oy":479,"y":479,"number":320,"links":[319,323],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1569,"x":1569,"oy":487,"y":487,"number":321,"links":[319,323,320],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1543,"x":1543,"oy":494,"y":494,"number":322,"links":[319,323,321],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1528,"x":1528,"oy":472,"y":472,"number":323,"links":[324,325],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1517,"x":1517,"oy":458,"y":458,"number":324,"links":[325,330],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1517,"x":1517,"oy":407,"y":407,"number":325,"links":[330,332,326],"vx":0,"vy":0,"links_alt":[331],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1568,"x":1568,"oy":386,"y":386,"number":326,"links":[318,327,330],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1527,"x":1527,"oy":357,"y":357,"number":327,"links":[317,316,315],"vx":0,"vy":0,"links_alt":[325],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1484,"x":1484,"oy":342,"y":342,"number":328,"links":[327,326,332,333,325,315],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1405,"x":1405,"oy":355,"y":355,"number":329,"links":[315,305,304],"vx":0,"vy":0,"links_alt":[327],"hovered":false,"being_linked":false,"dragged":false,"being_linked_alternatively":false},{"ox":1419,"x":1419,"oy":393,"y":393,"number":330,"links":[328,315,305,329,332,295,331],"vx":0,"vy":0,"links_alt":[185,289],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1319,"x":1319,"oy":425,"y":425,"number":331,"links":[294,390],"vx":0,"vy":0,"links_alt":[333,293,285],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":1385,"x":1385,"oy":467,"y":467,"number":332,"links":[331,335,341,299],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1467,"x":1467,"oy":455,"y":455,"number":333,"links":[332,325,330],"vx":0,"vy":0,"links_alt":[344],"hovered":false,"dragged":false,"being_linked":false,"being_linked_alternatively":false},{"ox":1494,"x":1494,"oy":510,"y":510,"number":334,"links":[335,333,336],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1479,"x":1479,"oy":505,"y":505,"number":335,"links":[333,338,340],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1495,"x":1495,"oy":545,"y":545,"number":336,"links":[335,339],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1456,"x":1456,"oy":562,"y":562,"number":337,"links":[333,334,336,339,350],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1414,"x":1414,"oy":535,"y":535,"number":338,"links":[299,339],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1416,"x":1416,"oy":517,"y":517,"number":339,"links":[333,332,299,342],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1410,"x":1410,"oy":571,"y":571,"number":340,"links":[337,338,344],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1393,"x":1393,"oy":583,"y":583,"number":341,"links":[331,339,299,342],"vx":0,"vy":0,"links_alt":[],"hovered":false,"being_linked":false,"dragged":false},{"ox":1357,"x":1357,"oy":590,"y":590,"number":342,"links":[299,343,340,338],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1383,"x":1383,"oy":607,"y":607,"number":343,"links":[344,345,341],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1406,"x":1406,"oy":621,"y":621,"number":344,"links":[341],"vx":0,"vy":0,"links_alt":[346],"hovered":false,"dragged":false,"being_linked_alternatively":false,"being_linked":false},{"ox":1391,"x":1391,"oy":664,"y":664,"number":345,"links":[344],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1410,"x":1410,"oy":716,"y":716,"number":346,"links":[345,347,348],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1455,"x":1455,"oy":705,"y":705,"number":347,"links":[350,349,348],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1452,"x":1452,"oy":730,"y":730,"number":348,"links":[351,352],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1515,"x":1515,"oy":626,"y":626,"number":349,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":1491,"x":1491,"oy":606,"y":606,"number":350,"links":[349,346],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1518,"x":1518,"oy":726,"y":726,"number":351,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":1546,"x":1546,"oy":752,"y":752,"number":352,"links":[351,353,354,355,357,356],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1476,"x":1476,"oy":796,"y":796,"number":353,"links":[355,354,356,357,363],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1467,"x":1467,"oy":862,"y":862,"number":354,"links":[355],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1498,"x":1498,"oy":864,"y":864,"number":355,"links":[363,362],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1562,"x":1562,"oy":813,"y":813,"number":356,"links":[355,357,364],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1593,"x":1593,"oy":799,"y":799,"number":357,"links":[358,363,361,366],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1623,"x":1623,"oy":773,"y":773,"number":358,"links":[360,361,367],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1631,"x":1631,"oy":734,"y":734,"number":359,"links":[358],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1614,"x":1614,"oy":711,"y":711,"number":360,"links":[359],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1649,"x":1649,"oy":810,"y":810,"number":361,"links":[362,363,364,365],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1665,"x":1665,"oy":834,"y":834,"number":362,"links":[367],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1581,"x":1581,"oy":870,"y":870,"number":363,"links":[356,367,368],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1607,"x":1607,"oy":873,"y":873,"number":364,"links":[363,367],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1653,"x":1653,"oy":875,"y":875,"number":365,"links":[362,364],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1638,"x":1638,"oy":887,"y":887,"number":366,"links":[361],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1622,"x":1622,"oy":900,"y":900,"number":367,"links":[366,369],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1602,"x":1602,"oy":899,"y":899,"number":368,"links":[364,357,367],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1628,"x":1628,"oy":938,"y":938,"number":369,"links":[370],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false,"being_linked":false},{"ox":1704,"x":1704,"oy":951,"y":951,"number":370,"links":[],"vx":0,"vy":0,"links_alt":[],"hovered":false,"dragged":false},{"ox":-14,"x":-14,"oy":140,"y":140,"vx":0,"vy":0,"number":371,"dragged":false,"hovered":false,"being_linked":false},{"ox":-47,"x":-47,"oy":180,"y":180,"vx":0,"vy":0,"number":372,"dragged":false,"hovered":false},{"ox":-14,"x":-14,"oy":217,"y":217,"vx":0,"vy":0,"number":373,"dragged":false,"hovered":false},{"ox":-17,"x":-17,"oy":266,"y":266,"vx":0,"vy":0,"number":374,"dragged":false,"hovered":false},{"ox":-13,"x":-13,"oy":226,"y":226,"vx":0,"vy":0,"number":375,"dragged":false,"hovered":false},{"ox":-5,"x":-5,"oy":317,"y":317,"vx":0,"vy":0,"number":376,"dragged":false,"hovered":false},{"ox":461,"x":461,"oy":963,"y":963,"vx":0,"vy":0,"number":377,"dragged":false,"hovered":false,"links":[379,381,382],"links_alt":[],"being_linked":false},{"ox":457,"x":457,"oy":954,"y":954,"vx":0,"vy":0,"number":378,"links":[90,377,379],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false},{"ox":455,"x":455,"oy":1007,"y":1007,"vx":0,"vy":0,"number":379,"links":[382,381,380],"links_alt":[93],"dragged":false,"hovered":false,"being_linked":false,"being_linked_alternatively":false},{"ox":484,"x":484,"oy":955,"y":955,"vx":0,"vy":0,"number":380,"links":[381,90,377],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false},{"ox":476,"x":476,"oy":1001,"y":1001,"vx":0,"vy":0,"number":381,"links":[382],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false},{"ox":480,"x":480,"oy":1032,"y":1032,"vx":0,"vy":0,"number":382,"links":[],"links_alt":[],"dragged":false,"hovered":false},{"ox":1104,"x":1104,"oy":788,"y":788,"vx":0,"vy":0,"number":383,"links":[384],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false},{"ox":1079,"x":1079,"oy":811,"y":811,"vx":0,"vy":0,"number":384,"links":[171],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false},{"ox":1098,"x":1098,"oy":817,"y":817,"vx":0,"vy":0,"number":385,"links":[383,384],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false},{"ox":1706,"x":1706,"oy":166,"y":166,"vx":0,"vy":0,"number":386,"links":[],"links_alt":[],"dragged":false,"hovered":false},{"ox":1690,"x":1690,"oy":200,"y":200,"vx":0,"vy":0,"number":387,"links":[],"links_alt":[],"dragged":false,"hovered":false},{"ox":1687,"x":1687,"oy":239,"y":239,"vx":0,"vy":0,"number":388,"links":[],"links_alt":[],"dragged":false,"hovered":false},{"ox":1716,"x":1716,"oy":278,"y":278,"vx":0,"vy":0,"number":389,"links":[],"links_alt":[],"dragged":false,"hovered":false},{"ox":1241,"x":1241,"oy":429,"y":429,"vx":0,"vy":0,"number":390,"links":[332],"links_alt":[],"dragged":false,"hovered":false,"being_linked":false}]
;

//input_data_array=[];
var primaryWorldMap = new particleDrivenMap(input_data_array);
//var primaryWorldMap = new particleDrivenMap();