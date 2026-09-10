class class1 {
  constructor(zwei, drei, vier) {
    this.moduleParts = zwei; 
    this.moduleIndex = drei;
    this.classList = vier;
  }
}

class class2 {
  constructor(farbe, regen) {
    this.elementSelector = farbe;
    this.activeFilterBtnClasses = [];
    this.moduleArray = regen;
  }
}

var allM = [];
var fMAB = [];

var allF = [];   

var rO = false;

var sET = "";
var fN;
var fNS = "";

function MachEtwas($element) {

  var classList = $element.attr('class').split(/\s+/);

  classListFiltered = jQuery.grep(classList, function (className, index) {

    var returnValue = 0;  // 1 = take class with module
    if ((className.indexOf("et") !== 0) && ((className.indexOf("dfs-") !== 0))) {      
      $element.removeClass(className);
      returnValue = 1;
    }

    // TODO: ersetzen mit include
    if(className.indexOf(sET + "_") == 0) {
      if((sET === "et_pb_column") && !(className.charAt(14) === "_") && !(className.charAt(15) === "_") && !(className.charAt(16) === "_")) {
        $element.removeClass(className);
        returnValue = 1;
      }
      else if ((sET === "et_pb_row") && !(className.charAt(11) === "_") && !(className.charAt(12) === "_") && !(className.charAt(13) === "_")){
        $element.removeClass(className);
        returnValue = 1;
      }
    }


    return returnValue
  });

  return classListFiltered;

}

function EntferneCode($element) {
  // get classList as array
  var listezwei = $element.attr('class').split(/\s+/);
  var moduleIndexClass = jQuery.grep(listezwei, function (value, index) {
    return value.indexOf("df-elementindex-") === 0;
  });

  var moduleIndex;
  if(moduleIndexClass.length == 1) { 
    var moduleIndexAsString = moduleIndexClass[0].substring(16);

    moduleIndex = parseInt(moduleIndexAsString);

    $element.removeClass(moduleIndexClass[0]);
  }
  else if(moduleIndexClass.length == 0) {
    moduleIndex = -1;    
  }
  else(
    console.log("Divi Filter Plugin: Error 563 More than one or no moduleIndex class")
  )
  return moduleIndex;
}

function lasseCodeLaufen($button) {

  var filterClassListButton = $button.attr('class').split(/\s+/);

  filterClassListButton = jQuery.grep(filterClassListButton, function (element) {
    return element.indexOf("dfc-") === 0;
  });

  var filterClassesOfButton = jQuery.grep(filterClassListButton, function (element) {
    return element.indexOf("df-button") === -1;
  });
  return filterClassesOfButton;
}

function getFilterNumber($button) {

  var filterNumber = null;

  if($button.hasClass("df-button")) {
    $element = $button.closest(".et_pb_row");
  }
  else {
    $element = $button;
  }

  var classBuffer = $element.attr('class');
  if (classBuffer !== undefined) {
    var classList = classBuffer.split(/\s+/);

    classListFiltered = jQuery.each(classList, function (index, className) {
  
      if ((className.indexOf("dfn-") == 0)) {
        var stringFilterNumber = className.substring(4);
        filterNumber = parseInt(stringFilterNumber, 10);
      }
  
    });
  }

  return filterNumber;
}

function dv_funktionWichtig($button){

  var runOnce = false;
  if(allF[fN] !== undefined) {
    runOnce = true;
  }

  jQuery(".df-area" + fNS + " ." + sET).each(function(i, elementColumn){

    var moduleIndex = EntferneCode(jQuery(this));

    if(moduleIndex != -1) { 
      var childrenOfElement = [];


      jQuery(this).children().each(function () {
        childrenOfElement.push(jQuery(this).detach());
      });

      if(runOnce) {
        allF[fN].moduleArray[moduleIndex].moduleParts = childrenOfElement;
        MachEtwas(jQuery(this));
      }
      else {
        allM[moduleIndex] = new class1(childrenOfElement, moduleIndex, MachEtwas(jQuery(this)));
      }
    }
  });

  // create new filter Area
  if(!runOnce) {

    allModulesWithoutReference = allM.map(a => Object.assign({}, a));
    allF[fN] = new class2(sET, allModulesWithoutReference);

  }

  fMAB.splice(0, fMAB.length);

  fMAB = allF[fN].moduleArray.map(a => Object.assign({}, a));

  var filterClassesOfButton = lasseCodeLaufen($button);

  machZusammen(filterClassesOfButton);
    
  AuffuellenBitte();

}

function machZusammen(filterClassesOfButton) {

  if(filterClassesOfButton.length > 0) {
    var arrayOfIndexesForDeletion = [];
  
    jQuery.each(fMAB, function(indexOfFilterModuleArray, moduleValue) {
      var containsSameFilterClass = 0;
  
      if (moduleValue.classList !== undefined) {
  
        jQuery.each(moduleValue.classList, function(index, filterClassModule){
          jQuery.each(filterClassesOfButton, function( index, filterClassButton ) { 
  
            if(filterClassModule == filterClassButton){
              containsSameFilterClass = 1;
            }
          });
        })
      }
      else {
        containsSameFilterClass = 0;
      }

      if(containsSameFilterClass == 0) {
        arrayOfIndexesForDeletion.push(indexOfFilterModuleArray);      
      }
    });

    arrayOfIndexesForDeletion.sort(function(a, b){return b-a}); 
    jQuery.each(arrayOfIndexesForDeletion, function(index, arrayPosition) {
      fMAB.splice(arrayPosition, 1);
    })
  }
  
}

function AuffuellenBitte(){

  for (let filterableModuleIndex = 0; filterableModuleIndex < fMAB.length; filterableModuleIndex++) {

    var moduleIndexAsString = fMAB[filterableModuleIndex].moduleIndex.toString().padStart(3, "0");
    jQuery(".df-area" + fNS + " ." + sET + ":eq(" + filterableModuleIndex + ")").addClass("df-elementindex-" + moduleIndexAsString);

    jQuery.each(fMAB[filterableModuleIndex].classList, function( index, className ) {
      jQuery(".df-area" + fNS + " ." + sET + ":eq(" + filterableModuleIndex + ")").addClass(className);
    });

    jQuery.each(fMAB[filterableModuleIndex].moduleParts, function( index, value ) {
      jQuery(".df-area" + fNS + " ." + sET + ":eq(" + filterableModuleIndex + ")").append(fMAB[filterableModuleIndex].moduleParts[index]);
    });

  }

}

jQuery(function(jQuery) {

  jQuery(".df-area").before( "<!-- Filtering done with Divi Filter plugin, get it for free: https://danielvoelk.de/en/divi-filter/ -->" );

  if(jQuery(".df-area").length > 1) {
    console.log("Divi Filter Plugin: More than 1 filter area. Remove filter area or upgrade license!");
  }
  
  else {
    jQuery(".df-area").each(function(moduleIndex, elementColumn){

      var buffer = " ";

      var selectorElementType = "et_pb_column";

      jQuery(this).find("." + selectorElementType).each(function(moduleIndex, elementColumn){

        var moduleIndexAsString = moduleIndex.toString().padStart(3, "0");
        jQuery(this).addClass("df-elementindex-" + moduleIndexAsString);
    
      })

    })

    jQuery(".df-button").on('click', function() {

      event.preventDefault();
      fN = getFilterNumber(jQuery(this));
      if(fN == null) {
        fN = 1;
        fNS = "";


      }
      else {
        fNS = ".dfn-" + fN;
      }


      sET = "et_pb_column";

      

      dv_funktionWichtig(jQuery(this));

    });
  
  };


});