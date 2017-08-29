//var testsUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/';

define([
  'dojo/on', 'dojo/topic', 'dojo/query',
  'dojo/text!./templates/DisplaySettings.html',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/CheckBox',
  'esri/layers/ImageParameters',
  './S57ServiceLayer',
  /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
  './AISServiceLayer',
  //testsUrl + '../S57ServiceLayer.js',
  //testsUrl + '../AISServiceLayer.js',
  'bootstrap/Tab'
  //'dijit/form/Button'
], function(
  on, topic, query,
  template,
  declare, lang, array,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  Checkbox,
  ImageParameters,
  S57ServiceLayer,
  /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
  AISServiceLayer
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // description:
    //    Maritime

    templateString: template,
    baseClass: 'display-settings',
    widgetsInTemplate: true,
    /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
    aisLayer: null,
    s57Layer: null,
    s57LayerTitle: null,
    /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
    aisLayerTitle: null,
    s57CustomLayer: null,
    /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
    aisCustomLayer: null,
    map: null,

    // Properties to be sent into constructor

    postCreate: function() {
      // summary:
      //    Overrides method of same name in dijit._Widget.
      // tags:
      //    private
      console.log('maritime.DisplaySettings::postCreate', arguments);

      this.setupConnections();

      this.inherited(arguments);

      //this.s57Layer = this.map.getLayer("Maritime Chart Service_4144");
      //this.aisLayer = this.map.getLayer("Maritime Chart Service_4534");
      var imageParameters = new ImageParameters();
      imageParameters.format = "jpeg";

      s57CustomLayer = new S57ServiceLayer(this.s57Layer.url, {
        "opacity": this.s57Layer.opacity,
        "visible": this.s57Layer.visible,
        "imageParameters": imageParameters,
        "refreshInterval": this.s57Layer.refreshInterval,
        "maxScale": this.s57Layer.maxScale,
        "minScale": this.s57Layer.minScale,
        "id": this.s57LayerTitle || this.s57Layer.id,
        "description": this.s57Layer.description
      });
//        "id": this.this.s57Layer.arcgisProps || this.s57Layer.id,
//      s57CustomLayer.attr(arcgisProps, this.s57Layer.arcgisProps);

      s57CustomLayer.setVisibleLayers(this.s57Layer.visibleLayers);
      on(s57CustomLayer, 'parametersLoaded', lang.hitch(this, function() {
        this.setupDisplaySettings();
      }));

      on.once(s57CustomLayer, 'update-end', lang.hitch(this, function() {
          this.map.removeLayer(this.s57Layer);
      }));
      this.map.addLayer(s57CustomLayer, this.s57LayerIndex);

      /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
      if (this.aisLayer) {
        aisCustomLayer = new AISServiceLayer(this.aisLayer.url, {
          "opacity": this.aisLayer.opacity,
          "visible": this.aisLayer.visible,
          "imageParameters": imageParameters,
          "refreshInterval": this.aisLayer.refreshInterval,
          "maxScale": this.aisLayer.maxScale,
          "minScale": this.aisLayer.minScale,
          "id": this.aisLayerTitle || this.s57Layer.id,
          "description": this.aisLayer.description
        });

        on.once(aisCustomLayer, 'update-end', lang.hitch(this, function() {
          this.map.removeLayer(this.aisLayer);
        }));

        aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
        this.map.addLayer(aisCustomLayer);
      } else aisCustomLayer = null;
    },
    setupConnections: function() {
      // summary:
      //    wire events, and such
      //
      console.log('maritime.DisplaySettings::setupConnections', arguments);

    },
    setupDisplaySettings: function(){
      var dispObj = JSON.parse(this.parametersContent);
      var params = dispObj.ECDISParameters.DynamicParameters.Parameter;
      var dynamicHtml;
      if(this.controls && this.controls.length > 0) {
        var ctrlArr = this.controls.split(",");
        for (var i=0; i<ctrlArr.length; i++) {
          if(!this[ctrlArr[i]])
            continue;  //bypass all non-supported parameters
          this[ctrlArr[i]].style.display = "block";
          if (ctrlArr[i] !=="TextGroups") {
            for (var j=0; j<params.length; j++) {
              dynamicHtml = "";
              if (params[j].name === ctrlArr[i]) {
                switch(ctrlArr[i]) {
                  case "AreaSymbolizationType":
                  case "ColorScheme":
                  case "DisplayDepthUnits":
                  case "DisplayFrames":
                  case "PointSymbolizationType":
                  case "AttDesc":
                  for(var k=0; k<params[j].ExpectedInput.length; k++) {
                    if (params[j].value === params[j].ExpectedInput[k].code)
                      dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "' selected='selected'>" + params[j].ExpectedInput[k].value + "</option>";
                    else
                      dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "'>" + params[j].ExpectedInput[k].value + "</option>";
                  }
                  this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                  break;
                  case "DisplayCategory":
                  case "IntendedUsage":
                  var filter = params[j].value;
                  if (filter.substr(0,1)=="0") filter = "0"; // to handle special case for IntendedUsage
                  var selValues = filter.split(',');
                  for(var k=0; k<params[j].ExpectedInput.length; k++) {
                    var curChecked = false;
                    if (array.indexOf(selValues, params[j].ExpectedInput[k].code) >=0)
                      curChecked = true;
                    if (curChecked)
                      dynamicHtml += "<label><input type='checkbox' id='dbox" + (k+1) + "' value='" + params[j].ExpectedInput[k].code + "' checked/>" + params[j].ExpectedInput[k].value + "</label><br/>";
                    else
                      dynamicHtml += "<label><input type='checkbox' id='dbox" + (k+1) + "' value='" + params[j].ExpectedInput[k].code + "'/>" + params[j].ExpectedInput[k].value + "</label><br/>";
                  }
                  this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                  break;
                  case "DataQuality":
                  case "DisplayNOBJNM":
                  case "OptionalDeepSoundings":
                  case "IsolatedDangers":
                  case "HonorScamin":
                  case "ShallowDepthPattern":
                  case "LabelContours":
                  case "LabelSafetyContours":
                  case "TwoDepthShades":
                  if(params[j].value == "2")
                    this[ctrlArr[i] + "Ctrl"].set("checked", true);
                  break;
                }
                break;
              }
            }
          }
          else {
            // text groups or Intended Usage
            var textParams = dispObj.ECDISParameters.DynamicParameters.ParameterGroup[0].Parameter;
            var dynamicHtml = "";
            for(var j=0; j<textParams.length; j++) {
              if (textParams[j].value == "2")
                dynamicHtml += "<label><input type='checkbox' id='dbox" + textParams[j].name + "' value='" + textParams[j].name + "' checked/>" + textParams[j].Description + "</label><br/>";
              else
                dynamicHtml += "<label><input type='checkbox' id='dbox" + textParams[j].name + "' value='" + textParams[j].name + "'/>" + textParams[j].Description + "</label><br/>";
            }
            this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
          }
        }
      }
      if (dispObj.ECDISParameters.StaticParameters) {
        var params = dispObj.ECDISParameters.StaticParameters.Parameter;
        var dynamicHtml;
        if(this.controls && this.controls.length > 0) {
          var ctrlArr = this.controls.split(",");
          for (var i=0; i<ctrlArr.length; i++) {
            this[ctrlArr[i]].style.display = "block";
            if (ctrlArr[i] !=="TextGroups") {
              for (var j=0; j<params.length; j++) {
                dynamicHtml = "";
                if (params[j].name === ctrlArr[i]) {
                  switch(ctrlArr[i]) {
                    case "AreaSymbolizationType":
                    case "PointSymbolizationType":
                    for(var k=0; k<params[j].ExpectedInput.length; k++) {
                      if (params[j].value === params[j].ExpectedInput[k].code)
                        dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "' selected='selected'>" + params[j].ExpectedInput[k].value + "</option>";
                      else
                        dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "'>" + params[j].ExpectedInput[k].value + "</option>";
                    }
                    this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                    break;
                  }
                  break;
                }
              }
            }
          }
        }
      }
      var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
      this.input_shallow.value = parametersArray[this.findParameter(parametersArray, 'ShallowContour')].value.toString();
      this.input_safety.value = parametersArray[this.findParameter(parametersArray, 'SafetyContour')].value.toString();
      this.input_deep.value = parametersArray[this.findParameter(parametersArray, 'DeepContour')].value.toString();

      this._initEventHandlers();
    },
    _initEventHandlers: function() {
      var _this = this;
      this.own(on(this.ColorSchemeCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "ColorScheme")].value = parseInt(_this.ColorSchemeCtrl.value, 10);
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer) {
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
          aisCustomLayer.refresh();
        }
      }));
      this.own(on(this.AttDescCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "AttDesc")].value = parseInt(_this.AttDescCtrl.value, 10);
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer) {
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
          aisCustomLayer.refresh();
        }
      }));
      this.own(on(this.DisplayDepthUnitsCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "DisplayDepthUnits")].value = parseInt(_this.DisplayDepthUnitsCtrl.value, 10);
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(on(this.TwoDepthShadesCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "TwoDepthShades")].value = _this.TwoDepthShadesCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(on(this.ShallowDepthPatternCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "ShallowDepthPattern")].value = _this.ShallowDepthPatternCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(on(this.PointSymbolizationTypeCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        if (_this.findParameter(parametersArray, "PointSymbolizationType")>-1) {
          parametersArray[_this.findParameter(parametersArray, "PointSymbolizationType")].value = parseInt(_this.PointSymbolizationTypeCtrl.value, 10);
          s57CustomLayer.refresh();
          /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
          if (aisCustomLayer)
            aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
        }
        else {
          var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.StaticParameters.Parameter;
          if (_this.findParameter(parametersArray, "PointSymbolizationType")>-1) {
            parametersArray[_this.findParameter(parametersArray, "PointSymbolizationType")].value = parseInt(_this.PointSymbolizationTypeCtrl.value, 10);
            s57CustomLayer.refresh();
            /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
            if (aisCustomLayer)
              aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
          }
        }
      }));
      this.own(on(this.AreaSymbolizationTypeCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        if (_this.findParameter(parametersArray, "AreaSymbolizationType")>-1) {
          parametersArray[_this.findParameter(parametersArray, "AreaSymbolizationType")].value = parseInt(_this.AreaSymbolizationTypeCtrl.value, 10);
          s57CustomLayer.refresh();
          /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
          if (aisCustomLayer)
            aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
        }
        else {
          var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.StaticParameters.Parameter;
          if (_this.findParameter(parametersArray, "AreaSymbolizationType")>-1) {
            parametersArray[_this.findParameter(parametersArray, "AreaSymbolizationType")].value = parseInt(_this.AreaSymbolizationTypeCtrl.value, 10);
            s57CustomLayer.refresh();
            /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
            if (aisCustomLayer)
              aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
          }
        }
      }));
      this.own(on(this.DisplayFramesCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "DisplayFrames")].value = parseInt(_this.DisplayFramesCtrl.value, 10);
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(on(this.HonorScaminCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "HonorScamin")].value = _this.HonorScaminCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(on(this.DisplayNOBJNMCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "DisplayNOBJNM")].value = _this.DisplayNOBJNMCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      topic.subscribe("mcs/setSafetyContour", function(){
        _this.input_safety.value = parseFloat(arguments[0][0], 10).toString();
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "SafetyContour")].value = parseFloat(_this.input_safety.value, 10);
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
        });
      this.own(on(this.DataQualityCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "DataQuality")].value = _this.DataQualityCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(on(this.IsolatedDangersCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "IsolatedDangers")].value = _this.IsolatedDangersCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));

      this.own(on(this.LabelContoursCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "LabelContours")].value = _this.LabelContoursCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));

      this.own(on(this.LabelSafetyContoursCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "LabelSafetyContours")].value = _this.LabelSafetyContoursCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));

      this.own(on(this.OptionalDeepSoundingsCtrl, 'change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        parametersArray[_this.findParameter(parametersArray, "OptionalDeepSoundings")].value = _this.OptionalDeepSoundingsCtrl.checked?2:1;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(query("input[type='checkbox']", _this.DisplayCategoryCtrl).on('change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        var selectedvalues = 0;
        query("input[type='checkbox']", _this.DisplayCategoryCtrl).forEach(function(checkbox) {
          if(checkbox.checked) {
            selectedvalues +=　parseInt(checkbox.value);
          }
        });
        var categories;
        switch(selectedvalues) {
          case 1:
            categories = "1";
            break;
          case 2:
            categories = "2";
            break;
          case 3:
            categories = "1,2";
            break;
          case 4:
            categories = "4";
            break;
          case 5:
            categories = "1,4";
            break;
          case 6:
            categories = "2,4";
            break;
          case 7:
            categories = "1,2,4";
            break;
          default:
            categories = "";
        }
        parametersArray[_this.findParameter(parametersArray, "DisplayCategory")].value = categories;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(query("input[type='checkbox']", _this.IntendedUsageCtrl).on('change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        var selectedUsages = "";
         query("input[type='checkbox']", _this.IntendedUsageCtrl).forEach(function(checkbox) {
          if(checkbox.checked) {
            selectedUsages = selectedUsages + checkbox.value + ",";
          }
        });
        if (selectedUsages.length>1) selectedUsages = selectedUsages.substr(0, selectedUsages.length-1); // remove the last comma
        if (selectedUsages.substr(0,1)=="0") selectedUsages = "0"; // to handle special case for IntendedUsage
        parametersArray[_this.findParameter(parametersArray, "IntendedUsage")].value = selectedUsages;
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
      }));
      this.own(query("input[type='checkbox']", _this.TextGroupsCtrl).on('change', function() {
        var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.ParameterGroup[0].Parameter;
        query("input[type='checkbox']", _this.TextGroupsCtrl).forEach(function(checkbox) {
          if (checkbox.checked) {
            parametersArray[_this.findParameter(parametersArray, checkbox.value)].value = 2;
          }
          else {
            parametersArray[_this.findParameter(parametersArray, checkbox.value)].value = 1;
          }
        });
        s57CustomLayer.refresh();
        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
        if (aisCustomLayer)
          aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
     }));
    },
    _onApplyClick: function( /*e*/ ) {
      var parametersArray = s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
      parametersArray[this.findParameter(parametersArray, "ShallowContour")].value = parseFloat(this.input_shallow.value, 10);
      parametersArray[this.findParameter(parametersArray, "SafetyContour")].value = parseFloat(this.input_safety.value, 10);
      parametersArray[this.findParameter(parametersArray, "DeepContour")].value = parseFloat(this.input_deep.value, 10);
      s57CustomLayer.refresh();
      /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
      if (aisCustomLayer)
        aisCustomLayer.displayParameters = s57CustomLayer.displayParameters;
    },
    findParameter: function(parametersArray, name) {
       for (i = 0; i < parametersArray.length; i++) {
        if (parametersArray[i].name == name) {
          return (i);
        }
      }
      return (-1);
    }
  });
});
