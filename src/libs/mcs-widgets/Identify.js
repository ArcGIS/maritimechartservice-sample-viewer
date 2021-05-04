define([
  'dojo/text!./templates/Identify.html',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/query',
  'dojo/topic',
  'dojo/_base/array',
  "dojo/promise/all",
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'esri/tasks/IdentifyParameters',
  'esri/tasks/IdentifyTask',
  'esri/InfoTemplate',
  'esri/domUtils',
  'esri/request',
  'jimu/PanelManager',
  'dojo/aspect',
  'esri/layers/ImageParameters',
  './S57ServiceLayer'

], function(
  template,
  declare,
  lang, on, dom, domConstruct, query, topic, array, all,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  IdentifyParameters,
  IdentifyTask, InfoTemplate,
  domUtils, esriRequest, PanelManager, aspect,
  ImageParameters, S57ServiceLayer
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // description:
    //    Custom Identify

    templateString: template,
    baseClass: 'identify',
    widgetsInTemplate: true,
    map: null,
    drawLayer: null,
    drawLayerId: null,
    drawToolBar: null,
    showClear: false,
    pointGraphic: null,
    identifyParams: null,
    s57CustomLayers: [],
    identifyTasks: [],
    // Properties to be sent into constructor

    postCreate: function() {
      // summary:
      //    Overrides method of same name in dijit._Widget.
      // tags:
      //    private
      console.log('Identify::postCreate', arguments);

      this.setupConnections();

      this.inherited(arguments);

      if (this.map) {
        this.setMap(this.map);
      }
      this.setupMCSLayers();
      this.injectDisplayParameters();
      this.createQueryTasks(this.s57CustomLayers);
      this.identifyParams = new IdentifyParameters();
      this.identifyParams.tolerance = 10;
      this.identifyParams.returnGeometry = true;
      this.identifyParams.dpi = 96;
      
      var moreInfoLink = domConstruct.create("a", {
        "class": "action",
        "id": "moreInfoLink",
        "innerHTML": "More Info", //text that appears in the popup for the link 
        "href": "javascript: void(0);"
      }, query(".actionList", this.map.infoWindow.domNode)[0]);

      //when the link is clicked register a function that will run 
      on(moreInfoLink, "click", function(e) {
        moreInfoDiv = dom.byId('moreInfoDiv');
        if (moreInfoLink.innerHTML == "More Info") {
          moreInfoLink.innerHTML = "Less Info";
          domUtils.show(moreInfoDiv);
        } else {
          moreInfoLink.innerHTML = "More Info";
          domUtils.hide(moreInfoDiv);
        }
      });

      on(this.map.infoWindow, "selection-change", function() {
        moreInfoDiv = dom.byId('moreInfoDiv');

        if (moreInfoLink.innerHTML == "More Info") {
          domUtils.hide(moreInfoDiv);
        } else {
          domUtils.show(moreInfoDiv);
        }

      });
      
    },

    setupConnections: function() {
      // summary:
      //    wire events, and such
      //
      console.log('Identify::setupConnections', arguments);

    },

    setMap: function(map) {
      if (map) {
        this.map = map;
      }
    },

    destroy: function() {
      if (this.pointGraphic) {
        this.map.graphics.remove(this.pointGraphic);
      }
      this.pointGraphic = null;
      this.map = null;
      this.inherited(arguments);
    },

    setupMCSLayerCheckbox: function(layer, flagChecked) {
      var checkboxDiv = domConstruct.create("div", {}, this.MCSLayersIdentifyDiv);
      domConstruct.create("input", {
        type: "checkbox",
        id: "checkbox_" + layer.id + "_Identify",
        checked: flagChecked
      }, checkboxDiv);
      domConstruct.create("b", {
        innerHTML: this._getLayerTitle(layer)
      }, checkboxDiv);
    },

    setupMCSLayers: function() {
      this.s57CustomLayers = [];
      var s57CustomLayer = null;
      for (var j = 0; j < this.map.layerIds.length; j++) {
        var layer = this.map.getLayer(this.map.layerIds[j]);

        var indexMCSStr1 = layer.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
        var indexMCSStr2 = layer.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
        var indexMCSStr3 = layer.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
        // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
        if ((indexMCSStr1 > 0 && layer.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
          || (indexMCSStr2 > 0 && layer.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
          || (indexMCSStr3 > 0 && layer.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {
        
          // If S57ServiceLayer is already initialized by display setting widget or Identify widget. 
          if (layer.isInstanceOf && layer.isInstanceOf(S57ServiceLayer))  
          {
            s57CustomLayer = layer;
            this.setupMCSLayerCheckbox(s57CustomLayer, true);
          } else {
            var imageParameters = new ImageParameters();
            imageParameters.format = "jpeg";

            s57CustomLayer = new S57ServiceLayer(layer.url, {
              "opacity": layer.opacity,
              "visible": layer.visible,
              "imageParameters": imageParameters,
              "refreshInterval": layer.refreshInterval,
              "maxScale": layer.maxScale,
              "minScale": layer.minScale,
              "id": layer.id,
              "description": layer.description
            });
            s57CustomLayer.title = this._getLayerTitle(layer);
            s57CustomLayer.setVisibleLayers(layer.visibleLayers);
            on(s57CustomLayer, 'parametersLoaded', lang.hitch(this, function (layer, s57CustomLayer, j) {
              // add s57CustomLayer after parametersLoaded, otherwise it will miss some properties' information, like layerInfos, 
              // which will cause the sublayers to not show in LayerList widget.
              this.map.removeLayer(layer);
              this.map.addLayer(s57CustomLayer, j); 
              this.setupMCSLayerCheckbox(this.map.getLayer(s57CustomLayer.id), true);
            }, layer,s57CustomLayer, j));
          }
          this.s57CustomLayers.push(s57CustomLayer);
        }
      }
    },

    injectDisplayParameters: function () {
      esriRequest.setRequestPreCallback(lang.hitch(this, preCallback));
      function preCallback(ioArgs) {
        if (ioArgs.url) {
          var indexMCSStr1 = ioArgs.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
          var indexMCSStr2 = ioArgs.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
          var indexMCSStr3 = ioArgs.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
          // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
          if ((indexMCSStr1 > 0 && ioArgs.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
            || (indexMCSStr2 > 0 && ioArgs.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
            || (indexMCSStr3 > 0 && ioArgs.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {  
              for (var i = 0; i < this.s57CustomLayers.length; i++){
                if (ioArgs.url.slice(0, -9) == this.s57CustomLayers[i].url && this.s57CustomLayers[i].displayParameters) {
                  ioArgs.content.display_params = JSON.stringify(this.s57CustomLayers[i].displayParameters);
                  break;
                }
              }
            }
        }
        return ioArgs;
      }
    },

    setDrawBox: function(newDrawBox) {

      var _this = this;
      this.drawBox = newDrawBox;
      this.drawBox.setMap(this.map);
      this.drawBox.geoTypes = ['POINT', 'EXTENT'];
      this.drawBox._initTypes();

      // Initialize reference to the widgetManager
      
      if (PanelManager.getInstance() && PanelManager.getInstance().activePanel.widgetManager) {
        this.widgetManager = PanelManager.getInstance().activePanel.widgetManager;
        // Interact with other widgets.
        if(this.widgetManager) {
          // If the widgets are not loded yet, listen to widget created event from widget manager.
          this.own(on(this.widgetManager, 'widget-created', function(widget) {
            if (typeof(widget) === "undefined") return;
            if(widget.name == 'MaritimeIdentify') {
              _this.widgetid = widget.id;
              // If the widget is configured to open at start, make it sticky (The widget will reactivate after Select and Measurement widgets are deactivated).
              if(widget.openAtStart) {
                _this.makeSticky = true;
                // Activate the identify by point by default        
                _this.drawBox.activate('POINT');
                // Close the panel if it was configured to open at start.
                PanelManager.getInstance().closePanel(widget.id + '_panel');
              }
            }
            else if(widget.name === 'Measurement' && widget.measurement) {
              _this._onMeasurementToggle(_this, widget);
            }
            else if(widget.name === 'Select' && widget.selectDijit && widget.selectDijit.drawBox) {
              _this._onSelectToggle(_this, widget);
            }
          }));

          // If the widgets are already loaded (example both Identify, and Measurement/Select widgets are configured to open at startup).
          var measurementWidget = this.widgetManager.getWidgetsByName('Measurement')[0];
          if(measurementWidget) {
            _this._onMeasurementToggle(_this, measurementWidget);
          }
          var selectWidget = this.widgetManager.getWidgetsByName('Select')[0];
          if(selectWidget) {
            _this._onSelectToggle(_this, selectWidget);
          }
        }
      }

      this.own(on(this.drawBox, 'icon-selected', function (graphic, geotype, commontype) {
        _this.selectedTool = geotype;
        _this.drawBox.drawToolBar._toggleTooltip(false); // hide the tool tip.
        
        // Activating the drawBox sets ShowInfoWindowOnClick to false.
        // Enable to allow mashup of maritime identify tool with the default info window.
        // _this.map.setInfoWindowOnClick(true);
      }));

      this.own(on(this.drawBox, 'DrawEnd', function(graphic, geotype, commontype) {
        _this._onDrawEnd(graphic, geotype, commontype);
      }));
      this.drawBox.placeAt(this.drawBoxNode);
      this.drawBox.startup();
    },

    _getLayerTitle: function(layer) {

      var operLayers = this.map.webMapResponse.itemInfo.itemData.operationalLayers;
      var title = null;
      for (var j = 0; j < operLayers.length; j++) {
        if ((layer) && !(layer.displayParameters) && (layer.id == operLayers[j].id)) {
          title = operLayers[j].title;
        }
      }
      if (title) {
        return title;
      }

      if(layer.title) {
        return layer.title;
      }

      if(lang.getObject("_wabProperties.originalLayerName", false, layer)) {
        return layer.name || layer.id;
      }

      title = layer.label || layer.name || "";
      if (layer.url) {
        var serviceName;
        var index = layer.url.indexOf("/FeatureServer");
        if (index === -1) {
          index = layer.url.indexOf("/MapServer");
        }
        if (index === -1) {
          index = layer.url.indexOf("/service");
        }
        if(index > -1) {
          serviceName = layer.url.substring(0, index);
          serviceName = serviceName.substring(serviceName.lastIndexOf("/") + 1, serviceName.length);
          if (title) {
            title = serviceName + " - " + title;
          } else {
            title = serviceName;
          }
        }

      }
      return title || layer.id;
    },

    _onIdentifyRefreshClick: function() {
      // clear all the checkboxes
      while (this.MCSLayersIdentifyDiv.hasChildNodes()) {
        this.MCSLayersIdentifyDiv.removeChild(this.MCSLayersIdentifyDiv.lastChild);
      }

      this.setupMCSLayers();
      this.createQueryTasks(this.s57CustomLayers);
    },

    // Toggle MaritimeIdentify tool 'on' when the Measurement tool is toggled 'off' and vice versa
    // Deactivate the Maritime Identify before the setTool function of measurement tool, so that the
    // deactivate function does not interfare the mouse click handlers of the Measurement tool.
    _onMeasurementToggle: function(_this, measurementWidget) {
      aspect.before(measurementWidget.measurement, 'setTool', function() {
        _this.drawBox.deactivate(); 
      });
      
      aspect.after(measurementWidget.measurement, 'setTool', function() {
        if(_this.makeSticky && !measurementWidget.measurement.activeTool && _this.selectedTool) {
          _this.drawBox.activate(_this.selectedTool);
        }
      });
    },

    // Toggle MaritimeIdentify tool 'on' when the Select tool is toggled 'off' and vice versa
    _onSelectToggle: function(_this, selectWidget) {
        _this.own(on(selectWidget.selectDijit.drawBox, 'draw-activate', function() {
          if(_this.makeSticky) {
            _this.drawBox.deactivate();
            _this.isDeactivateFromActivateCall = false;
            //_this.map.setInfoWindowOnClick(false);
          }
        }));
        _this.own(on(selectWidget.selectDijit.drawBox, 'draw-deactivate', function() {
          if(_this.makeSticky) {
            if(!_this.isDeactivateFromActivateCall && _this.selectedTool) {
              // activate calls deactivate on other drawbox instances, which fires the draw-deactivate again, so do not listen to subsequent deactivate
              _this.isDeactivateFromActivateCall = true;
              _this.drawBox.activate(_this.selectedTool);
            }
          }
        }));
    },

    _onDrawEnd:function(graphic, geotype, commontype){

        this.drawBox.clear();
        this.map.infoWindow.clearFeatures(); 
        this.identifyGeom = graphic.geometry;
        if(geotype === 'EXTENT') 
        {
          this.identifyGeom = graphic.geometry.getExtent();
        }
        this.executeQueryTask(this.identifyGeom);
      },

    createQueryTasks: function(in_layers) {
      this.identifyTasks = [];
      for (var i = 0; i < in_layers.length; i++) {
        this.identifyTasks.push(new IdentifyTask(in_layers[i].url));
      }
    },

    executeQueryTask: function(geom) {
      var selectedCheckboxes = query("input[type=checkbox]:checked", this.MCSLayersIdentifyDiv);
      var selectedMCSLayerIds = selectedCheckboxes.map(lang.hitch(this, function(selectedCheckbox){
        return selectedCheckbox.id.slice(9, -9);
      }));

      identifyGeom = geom;

      this.identifyParams.geometry = identifyGeom;
      this.identifyParams.mapExtent = this.map.extent;
      this.identifyParams.width = this.map.width;
      this.identifyParams.height = this.map.height;

      var promises = {};
      for (var i = 0; i < this.identifyTasks.length; i++) {
        if (selectedMCSLayerIds.indexOf(this.s57CustomLayers[i].id) !== -1){
          var key = this.s57CustomLayers[i].url;
          promises[key] = this.identifyTasks[i].execute(this.identifyParams);
        }
      }

      var allPromises = new all(promises);
      allPromises.then(lang.hitch(this, function(responses){
        var features = []; 
        for (var key in responses) {
          if (responses.hasOwnProperty(key)){
            var response = responses[key];
            features = features.concat(
              array.map(response, lang.hitch(this, function (result) {
                var feature = result.feature;
                feature.attributes.layerName = result.layerName;
                if (result.layerName === 'S57 Cells') {
                  if (null != feature.attributes.TXTDSC) {
                    feature.attributes.TXTDSC = "<a href='" + key + "/notes?f=json&file=" + feature.attributes.txtdsc_token + "' target='_blank'>" + feature.attributes.TXTDSC + "</a>";
                  }
                  if (null != feature.attributes.NTXTDS) {
                    feature.attributes.NTXTDS = "<a href='" + key + "/notes?f=json&file=" + feature.attributes.ntxtds_token + "' target='_blank'>" + feature.attributes.NTXTDS + "</a>";
                  }
                  if (null != feature.attributes.PICREP) {
                    feature.attributes.PICREP = "<a href='" + key + "/notes?f=json&file=" + feature.attributes.picrep_token + "' target='_blank'>" + feature.attributes.PICREP + "</a>";
                  }

                  if (null != feature.attributes.cellName) {
                    feature.attributes.cellName = feature.attributes.cellName.replace(".000", "");
                  }

                  var geoString = JSON.stringify(feature.geometry);
                  if (geoString.indexOf("null") == -1){
                    switch (feature.geometry.type) {
                      case "polygon":
                        feature.attributes.geometryType = "Area";
                        break;
                      case "polyline":
                        feature.attributes.geometryType = "Line";
                        break;
                      case "point":
                        feature.attributes.geometryType = "Point";
                        break;
                    }
                  }
                  
                  if (feature.attributes.cellName.indexOf("AML") == 0) {
                    feature.attributes.usage = "AML 3.0";
                  }
                  else {
                    switch (feature.attributes.cellName.charAt(2)) {
                      case '1':
                        feature.attributes.usage = "Overview";
                        break;
                      case '2':
                        feature.attributes.usage = "General";
                        break;
                      case '3':
                        feature.attributes.usage = "Coastal";
                        break;
                      case '4':
                        feature.attributes.usage = "Approach";
                        break;
                      case '5':
                        feature.attributes.usage = "Harbour";
                        break;
                      case '6':
                        feature.attributes.usage = "Berthing";
                        break;
                      case '7':
                        feature.attributes.usage = "River";
                        break;
                      case '8':
                        feature.attributes.usage = "River harbour";
                        break;
                      case '9':
                        feature.attributes.usage = "River berthing";
                        break;
                      case 'A':
                        feature.attributes.usage = "Overlay";
                        break;
                      case 'B':
                        feature.attributes.usage = "Bathymetric ENC";
                        break;
                      case 'M':
                        feature.attributes.usage = "MFF (Maritime Foundation and Facilities)";
                        break;
                      case 'E':
                        feature.attributes.usage = "ESB (Environment, Seabed and Beach)";
                        break;
                      case 'R':
                        feature.attributes.usage = "RAL (Routes Areas and Limits)";
                        break;
                      case 'L':
                        feature.attributes.usage = "LBO (Large Bottom Objects)";
                        break;
                      case 'S':
                        feature.attributes.usage = "SBO (Small Bottom Objects)";
                        break;
                      case 'C':
                        feature.attributes.usage = "CLB (Contour Line Bathymetry)";
                        break;
                      case 'I':
                        feature.attributes.usage = "IWC (Integrated Water Column)";
                        break;
                      case 'N':
                        feature.attributes.usage = "NMB (Network Model Bathymetry)";
                        break;
                    }
                  }

                  feature.attributes.moreInfo = "";

                  var template = new InfoTemplate("Identify Results", this.generateInfoContent(feature));
                  feature.setInfoTemplate(template);
                }

                return feature;
              })));
          }
        }

        this.map.infoWindow.setFeatures(features);
        this.showInfoWindow(identifyGeom);
      }));

    },

    generateInfoContent: function(feature) {

      var blacklist = ["cellName", "compilationScale", "geometryType", "objectType", "objectTypeDescription", "rcid", "moreInfo", "usage", "txtdsc_token", "layerName"];
      var content = "<table><tr><td><b>${cellName}</b></td></tr></table>";
      content += "<p style='border: 2px inset; margin: 5px 0px ;'></p>";
      content += "<table><tr><td>Feature:</td><td style='padding-left: 1em;'>${objectType:formatFeatureName}</td></tr><tr><td>Description:</td><td style='padding-left: 1em;'>${objectTypeDescription}</td></tr><tr><td>Geometry:</td><td style='padding-left:1em;'>${geometryType}</td></tr><tr><td>Usage:</td><td style='padding-left:1em;'>${usage}</td></tr><tr><td>Compilation Scale:</td><td style='padding-left:1em;'>${compilationScale}</td></tr></table>";
      content += "<div id='moreInfoDiv' style='display: none;'>";
      content += "<p style='border: 2px inset; margin: 5px 0px ;'></p>";
      content += " <div style='height: 100px; overflow: auto;'><table>";

      for (var key in feature.attributes) {
        if (!(blacklist.indexOf(key) >= 0)) {
          content += "<tr><td>" + key + ":" + "</td><td style='padding-left: 1em;'>" + feature.attributes[key] + "</td></tr>";
        }
      }

      content += "</table></div></div>";
      return content;

    },

    setSafetyContour: function() {
      var feature = this.map.infoWindow.getSelectedFeature();
      if (feature.attributes["draught"] != "not available") {
        topic.publish('mcs/setSafetyContour', [feature.attributes["draught"]]);
      }
    },

    showInfoWindow: function(identifyGeom) {
      if (identifyGeom.type != 'point')
        identifyPoint = identifyGeom.getCenter();
      else
        identifyPoint = identifyGeom;
      var isInExtent = this.map.extent.contains(identifyPoint);
      if (isInExtent === true) {
        if (identifyPoint !== null) {
          this.map.infoWindow.show(identifyPoint);
          on(this.map.infoWindow, 'hide', lang.hitch(this, function() {
            this.map.graphics.clear();
          }));
        }
      }
    }

  });

});