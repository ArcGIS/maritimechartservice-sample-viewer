define([
  'dojo/text!./templates/Search.html',
  'dojo/dom-construct', 'dojo/on', 'dojo/dom', 'dojo/query',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/json',
  'dojo/request/xhr',
  "dojo/dom-construct",
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'esri/tasks/FindTask',
  'esri/tasks/FindParameters',
  'esri/Color',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/geometry/Point',
  'esri/geometry/Polyline',
  'esri/geometry/Polygon',
  'esri/graphic',
  'esri/request',
  'bootstrap/Collapse'
], function(
  template,
  domConstruct, on, dom, query,
  declare,
  lang, array, JSON, xhr, domConstruct,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  FindTask, FindParameters,
  Color, SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Point, Polyline, Polygon, Graphic, esriRequest
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // description:
    //    Custom Maritime Search

    templateString: template,
    baseClass: 'mcs-search',
    widgetsInTemplate: true,
    map: null,
    symbol: null,
    searchType: null,
    selectedLayerIdsAndIndexes: {},

    // Properties to be sent into constructor

    postCreate: function() {
      // summary:
      //    Overrides method of same name in dijit._Widget.
      // tags:
      //    private
      console.log('maritime.Search::postCreate', arguments);
      this.setupConnections();
      this.inherited(arguments);
      if (this.map) {
        this.setMap(this.map);
      }

      for(var i = 0; i < this.s57Layers.length; i++) {
        this.setupMCSLayerCheckbox(this.s57Layers[i], true);
      }
    },

    setupMCSLayerCheckbox: function(layer, flagChecked) {

      var checkboxDiv = domConstruct.create("div", {}, this.MCSLayersSearchDiv);
      domConstruct.create("input", {
        type: "checkbox",
        id: "checkbox_" + layer.id + "_Search",
        value: this._getLayerTitle(layer),
        checked: flagChecked
      }, checkboxDiv);
      domConstruct.create("b", {
        innerHTML: this._getLayerTitle(layer)
      }, checkboxDiv);
    },

    setupConnections: function() {
      // summary:
      //    wire events, and such
      //
      console.log('maritime.Search::setupConnections', arguments);

      this.own(on(this.searchtypeSelect, 'change', lang.hitch(this, function() {
        var obj = dom.byId("container_search_default_text");
        var type = this.searchtypeSelect.value;
        if (type == "cell") {
          obj.innerHTML = "Use the above search box to search for cells based on their Dataset Name (DSNM).";
        } else if (type == "national") {
          obj.innerHTML = "Use the above search box to search for features based on their National object Name (NOBJNM) attribute.";
        } else {
          obj.innerHTML = "Use the above search box to search for features based on their Object Name (OBJNAM) or National Object Name (NOBJNM) attribute.";
        }
      })));
    },

    setMap: function(map) {
      if (map) {
        this.map = map;
      }
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

    _onSearchRefreshClick: function() {
      this._clearChildNodes(this.MCSLayersSearchDiv);
      this._clearChildNodes(this.search_result_main);
      this.s57Layers = [];
      for (var j = 0; j < this.map.layerIds.length; j++) {
        var layer = this.map.getLayer(this.map.layerIds[j]);
        var indexMCSStr1 = layer.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
        var indexMCSStr2 = layer.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
        var indexMCSStr3 = layer.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
        // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
        if ((indexMCSStr1 > 0 && layer.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
          || (indexMCSStr2 > 0 && layer.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
          || (indexMCSStr3 > 0 && layer.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {
            this.s57Layers.push(layer);
          }
      }
      for(var i = 0; i < this.s57Layers.length; i++) {
        this.setupMCSLayerCheckbox(this.s57Layers[i], true);
      }

      // clear the graphics (the highlighted selections)
      this.map.graphics.clear();
    },

    _onSearchClick: function(e) {

      e.preventDefault();
      this._clearChildNodes(this.search_result_main);
      dom.byId("container_search_results").style = "display:visible";
      dom.byId("container_result_details").style = "display:none";
      this.selectedLayerIdsAndIndexes = {};
      
      //Create the find parameters
      var findParams = new FindParameters();
      findParams.returnGeometry = true;
      findParams.layerIds = [0];
      findParams.outSpatialReference = this.map.spatialReference;
      //Set the search text to the value in the box
      findParams.searchText = dom.byId("input_search").value;
      esri.config.defaults.io.timeout = 300000; // 5 minutes?
      searchType = this.searchtypeSelect.value;
      if (searchType == "cell") {
        findParams.searchFields = ["DSNM"];
      } else {
        findParams.searchFields = ["OBJNAM"];
      }

      var selectedCheckboxes = query("input[type=checkbox]:checked", this.MCSLayersSearchDiv);
      var index = 0;
      selectedCheckboxes.forEach(lang.hitch(this, function (MCSLayerCheckbox) {
        // get layerId from the checkbox's id
        var layerId = MCSLayerCheckbox.id.slice(9, -7);
        var s57ServiceUrl = this.map.getLayer(layerId).url;
        this.selectedLayerIdsAndIndexes[layerId] = index;
        index += 1;

        //Create Find Task using the URL of the map service to search
        this.findTask = new FindTask(s57ServiceUrl);
        this.findTask.execute(findParams, lang.hitch(this, function (layerName, layerId, in_results) {
          this.setSearchResults(in_results, layerName, layerId, 'default');
        }, MCSLayerCheckbox.value, layerId),
          lang.hitch(this, function (layerName, layerId, s57ServiceUrl, error) {
            this.findTaskError(layerName, layerId, s57ServiceUrl);
          }, MCSLayerCheckbox.value, layerId, s57ServiceUrl));
      }));
    },

    findTaskError: function(layerName, layerId, s57ServiceUrl){
        var params = {
          searchText: findParams.searchText,
          contains: true,
          returnGeometry: true,
          layers: [0],
          searchFields: findParams.searchFields,
          sr: this.map.spatialReference.wkid,
          f: "json"
        };

        var s57Layer = this.map.getLayer(layerId);
        if (s57Layer && s57Layer.credential && s57Layer.credential.token) {
          params.token = s57Layer.credential.token;
        }

        // if the failure is due to any invalid geometry and parse the result manually using dojo/request/xhr
        xhr(s57ServiceUrl + "/find", {
          query: params,
          headers: {
            "X-Requested-With": null
          }
        }).then(lang.hitch(this, function (result) {
          // replace all the inf and -inf following a digit and a comma with null so that the result string is json parsable
          result = result.replace(/\d,inf|\d,-inf/g, function (r1) { return r1.replace(/inf|-inf/, 'null'); })
          var jsonRes = JSON.parse(result)
          if (jsonRes && jsonRes.results) {
            // reorganize the result object to be in the same format returned by esri/findTask 
            var resArr = jsonRes.results;
            array.forEach(resArr, function (res, i) {
              res.feature = {}
              res.feature.geometry = res.geometry
              var geomString = JSON.stringify(res.geometry);
              // if this geometry has null mark it as invalid so that the zoom to button is not displayed for it
              if (geomString.indexOf("null") !== -1) {
                res.feature.geometry.type = "invalid";
              }
              else if (res.geometryType == "esriGeometryPolygon") {
                res.feature.geometry.type = "polygon";
              }
              else if (res.geometryType == "esriGeometryPolyline") {
                res.feature.geometry.type = "polyline";
              }
              else if (res.geometryType == "esriGeometryPoint") {
                res.feature.geometry.type = "point";
              }
              res.feature.attributes = res.attributes
            });
            this.setSearchResults(resArr, layerName, layerId, 'default');
          }
          else {
            this.findErrorFindTaskResults(result);
          }
        }), lang.hitch(this, function (err) {
          this.findErrorFindTaskResults(err);
        }));
    },

    findErrorFindTaskResults: function(error) {
      console.log(error);
    },

    setSearchResults: function(in_results, layerName, layerId, type) {
      if (type == "cell") {
        this.getCellSearchResults_Parser(in_results, layerName, layerId);
      } else {
        this.getSearchResults_Parser(in_results, layerName, layerId, this);
      }
    },

    _zoomToSelectedFeature: function (itemSelected) {
      this.map.graphics.clear();
      var maxZoom = this.map.getMaxZoom();  
      var geom;
      switch (itemSelected.feature.geometry.type) {
        case "polygon":
          this.symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 5), new Color([98, 194, 204,0.25]));
          geom = new esri.geometry.Polygon(itemSelected.feature.geometry);
          this.map.setExtent(geom.getExtent().expand(1.2));
          break;
        case "polyline":
          this.symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 5);
          geom = new esri.geometry.Polyline(itemSelected.feature.geometry);
          this.map.setExtent(geom.getExtent().expand(1.2));
          break;
        case "point":
          this.symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 20, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2), new Color([98, 194, 204,0.25]));
          geom = new esri.geometry.Point(itemSelected.feature.geometry);
          this.map.centerAndZoom(geom, maxZoom - 7);
          break;
      }
      this.map.graphics.add(new Graphic(geom, this.symbol));
    },

    _clearChildNodes: function (parentNode) {
      while (parentNode.hasChildNodes()) {
        parentNode.removeChild(parentNode.lastChild);
      }
    },

    sortByName: function(a, b) {
      var aName = a.name.toLowerCase();
      var bName = b.name.toLowerCase();
      return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },

    getSearchResults_Parser: function(json_results, layerName, layerId, widgetthis) {
      var array_usage_levels = ["Overview", "General", "Coastal", "Approach", "Harbour", "Berthing", "River", "River harbour", "River berthing", "Overlay", "Bathymetric ENC", "MFF (Maritime Foundation and Facilities)", "ESB (Environment, Seabed and Beach)", "RAL (Routes Areas and Limits)", "LBO (Large Bottom Objects)", "SBO (Small Bottom Objects)", "CLB (Contour Line Bathymetry)", "IWC (Integrated Water Column)", "NMB (Network Model Bathymetry)", "Unknown"];
      var cellName, cellName_trunc, usage_str, usage_val;
      var usageCount = [];
      var usageGroups = [];
      var usageIndex = 0, usageGroupIndex = 0;
      var previous_name = "";
      var searchByObjectName = false;

      if (json_results.length > 0) {
        var layerResultDiv = domConstruct.create("div", {
          "id": "div_" + layerId
        }, widgetthis.search_result_main);
        layerResultDiv.style.order = this.selectedLayerIdsAndIndexes[layerId]; 
        domConstruct.create("p", {
          "innerHTML": layerName
        }, layerResultDiv);
        var container, usagegroup, divgroup;

        array.forEach(json_results, function(item_details, i){

          var geometryType = "invalid";

          if(item_details.feature.geometry)
          {
            switch (item_details.feature.geometry.type) {
              case "polygon":
                geometryType = "Area";
                var polygon = new esri.geometry.Polygon(item_details.feature.geometry);
                centerPoint = polygon.getExtent().getCenter();
                geometryJson = polygon.toJson();
                break;
              case "polyline":
                geometryType = "Line";
                var polyline = new esri.geometry.Polyline(item_details.feature.geometry);
                centerPoint = polyline.getExtent().getCenter();
                geometryJson = polyline.toJson();
                break;
              case "point":
                geometryType = "Point";
                centerPoint = new esri.geometry.Point(item_details.feature.geometry);
                geometryJson = centerPoint.toJson();
                break;
            }
          }
          if (item_details.foundFieldName == 'OBJNAM') {
            searchByObjectName = true;
            cellName = item_details.feature.attributes.cellName;
            cellName_trunc = cellName.substr(0, ((cellName.length) - 4));
          }
          else {
            cellName = item_details.feature.attributes.DSNM;
            cellName_trunc = cellName.substr(0, ((cellName.length) - 4));
          }
          if (cellName.indexOf("AML") ==0) {
            usage_str = "AML 3";
          }
          else {
            usage_val = cellName.substr(2, 1);
            if (usage_val == "A") usage_val = "10";
            if (usage_val == "B") usage_val = "11";
            if (usage_val == "M") usage_val = "12";
            if (usage_val == "E") usage_val = "13";
            if (usage_val == "R") usage_val = "14";
            if (usage_val == "L") usage_val = "15";
            if (usage_val == "S") usage_val = "16";
            if (usage_val == "C") usage_val = "17";
            if (usage_val == "I") usage_val = "18";
            if (usage_val == "N") usage_val = "19";
            usage_str = array_usage_levels[usage_val - 1];
            if (!usage_str) {
              // if the usage_str is undefined set it to the Unknown category
              usage_str = array_usage_levels[19];
            }
          }

          if (previous_name != usage_str) {
            var groupIdx = -1;
            for(var idx = 0; idx<usageGroupIndex; idx++)
              if(usageGroups[idx] == usage_str) {
                groupIdx = idx;
                break;
              }
            if (previous_name != "") {
              // set the count of this previous group
              var saved = false;
              for(var idx = 0; idx<usageGroupIndex; idx++)
                if(usageGroups[idx] == previous_name) {
                  usageCount[idx] = counter;
                  saved = true;
                  break;
                }
              if (!saved) usageCount[usageIndex++] = counter;
            }
 
            if (groupIdx==-1) {
              usageGroups[usageGroupIndex++] = usage_str;
              counter = 0;
              container = domConstruct.create("div", {
              }, layerResultDiv); 

              usagegroup = domConstruct.create("button", {
                'class':"btn",
                'data-toggle':"collapse",
                'data-target':"#container_" + layerId + usage_str.replace(" ", "_").replace(",", "_"),
                innerHTML: usage_str + "&nbsp;&nbsp;&nbsp;&nbsp;<span id='span_" + layerId + usage_str + "' class='badge'>0</span>",
                id: 'usage_' + usage_str.replace(" ", "_").replace(",", "_")  
              }, container); 
              divgroup = domConstruct.create("div", {
                'class': "collapse",
                id: 'container_'+ layerId + usage_str.replace(" ", "_").replace(",", "_")
              }, container);
            }
            else {
              counter = usageCount[groupIdx];
              divgroup = dom.byId('container_' + layerId + usage_str.replace(" ", "_").replace(",", "_"));
            }
          }

          if (searchByObjectName) {
            // add the individual record (summary mode)
            var content = "<div class='col-sm-6'><b> " + cellName_trunc + "</div></b>";
            var rec = domConstruct.create("div", {
              'class': "row attr-value",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'>DATASET</div>";
            rec = domConstruct.create("div", {
              'class': "row attr-name",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'><b> " + item_details.feature.attributes.objectType + "</div></b>";
            rec = domConstruct.create("div", {
              'class': "row attr-value",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-8'>FEATURE</div>";
            content += "<div class='col-sm-4 row-actions'><a href='#' class='btn btn-default btn-xs' data-details-button id='details_" 
              + item_details.feature.attributes.rcid + "'><span class='glyphicon glyphicon-info-sign'><span></a>";

            if(geometryType !== "invalid")
            {
              content += "<a href='#' class='btn btn-default btn-xs' data-details-zoom id='zoomto_" + item_details.feature.attributes.rcid + "'>"
                + "<span class='glyphicon glyphicon-map-marker'><span></a></div>"
            }
            rec = domConstruct.create("div", {
              'class': "row attr-name",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'><b>" + geometryType + "</b></div>";
            rec = domConstruct.create("div", {
              'class': "row attr-value",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'>GEOMETRY</div>";
            rec = domConstruct.create("div", {
              'class': "row attr-name",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'><b>" + item_details.feature.attributes.compilationScale + "</b></div>";
            rec = domConstruct.create("div", {
              'class': "row attr-value",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'>COMPILATION SCALE</div>";
            rec = domConstruct.create("div", {
              'class': "row attr-name",
              innerHTML:  content
            }, divgroup);
            if (item_details.feature.attributes.NOBJNM) {
              content = "<div class='col-sm-6'><b>" + item_details.feature.attributes.NOBJNM + "</b></div>";
              rec = domConstruct.create("div", {
                'class': "row attr-value",
                innerHTML:  content
              }, divgroup);
              content = "<div class='col-sm-6'>NOBJNM</div>";
              rec = domConstruct.create("div", {
                'class': "row attr-name",
                innerHTML:  content
              }, divgroup);
            }
            content = "<div class='col-sm-6'><b>" + item_details.feature.attributes.OBJNAM + "</b></div>";
            rec = domConstruct.create("div", {
              'class': "row attr-value",
              innerHTML:  content
            }, divgroup);
            content = "<div class='col-sm-6'>OBJNAM</div>";
            rec = domConstruct.create("div", {
              'class': "row attr-name",
              innerHTML:  content
            }, divgroup);
            rec = domConstruct.create("hr", null, divgroup);

            // Increment Counter
            counter++;
            // Update previous_name
            previous_name = usage_str;
          }
          else { 
            // search by database object names
            for (var key in item_details.feature.attributes) {
              if (item_details.feature.attributes.hasOwnProperty(key)) {
                var detailcontent = "<div class='col-sm-12'><b> " + item_details.feature.attributes[key] + "</div></b>";
                var detailrec = domConstruct.create("div", {
                  'class': "row attr-value",
                  innerHTML:  detailcontent
                }, divgroup);
                if(key.toUpperCase()=='DSNM') {
                  detailcontent = "<div class='col-sm-8'>" + key.toUpperCase() + "</div>";
                  if(geometryType !== "invalid")
                  {
                    detailcontent += "<div class='col-sm-4 row-actions'><a href='#' class='btn2 btn-default btn-xs' data-details-zoom id='zoom2_" + item_details.feature.attributes.DSNM.substr(0, ((item_details.feature.attributes.DSNM.length) - 4)) + "'><span class='glyphicon glyphicon-map-marker'><span></a></div>"
                  }  
                }
                else
                  detailcontent = "<div class='col-sm-12'>" + key.toUpperCase() + "</div>";
                detailrec = domConstruct.create("div", {
                  'class': "row attr-name",
                  innerHTML:  detailcontent
                }, divgroup);
              }
            }          
            detailrec = domConstruct.create("hr", null, divgroup);
            // Increment Counter
            counter++;
            // Update previous_name
            previous_name = usage_str;
          }
        });
        on(dom.byId("clear_results"), "click",  lang.hitch(this, function(e){
            var parentNode = dom.byId("result_detail_main");
            while (parentNode.hasChildNodes()) {
              parentNode.removeChild(parentNode.lastChild);
            }

            parentNode = dom.byId("search_result_main");
            while (parentNode.hasChildNodes()) {
              parentNode.removeChild(parentNode.lastChild);
            }
            this.map.graphics.clear();
        }));
        for(var idx = 0; idx<usageGroupIndex; idx++)
          if(usageGroups[idx] == usage_str) {
            groupIdx = idx;
            break;
          }
        if (groupIdx==-1) 
          usageCount[usageIndex++] = counter;
        else
          usageCount[groupIdx] = counter;

        // change the badge to the numbers of records within each group
        for(var i=0; i<usageGroups.length; i++)
          dom.byId('span_'+ layerId +usageGroups[i]).innerHTML = usageCount[i];
        console.log(usageCount);
        console.log(usageGroups);
        if (searchByObjectName) {
          query("#search_result_main .row a[data-details-button]").on("click", lang.hitch(this, function(evt) {
            var rcid = evt.currentTarget.id.split("_")[1];
            var itemSelected;
            for(i=0; i<json_results.length; i++) {
              if (json_results[i].feature.attributes.rcid == rcid) {
                itemSelected = json_results[i];
                break;
              }
            }
          console.log("rcid is " + rcid);
            var parentNode = dom.byId("result_detail_main");
            while (parentNode.hasChildNodes()) {
              parentNode.removeChild(parentNode.lastChild);
            }
            var detailcontainer = domConstruct.create("div", {
              'class':"col-sm-12"
            }, parentNode); 
            for (var key in itemSelected.feature.attributes) {
              if (itemSelected.feature.attributes.hasOwnProperty(key)) {
                var detailcontent = "<div class='col-sm-12'><b> " + itemSelected.feature.attributes[key] + "</div></b>";
                var detailrec = domConstruct.create("div", {
                  'class': "row attr-value",
                  innerHTML:  detailcontent
                }, detailcontainer);
                if(itemSelected.feature.geometry && key.toUpperCase()=='RCID') {
                  detailcontent = "<div class='col-sm-8'>" + key.toUpperCase() + "</div>";
                  detailcontent += "<div class='col-sm-4 row-actions'><a href='#' class='btn btn-default btn-xs' data-details-zoom id='zoom2_" + itemSelected.feature.attributes.rcid + "'><span class='glyphicon glyphicon-map-marker'><span></a></div>"
                }
                else
                  detailcontent = "<div class='col-sm-12'>" + key.toUpperCase() + "</div>";
                detailrec = domConstruct.create("div", {
                  'class': "row attr-name",
                   innerHTML:  detailcontent
                }, detailcontainer);
              }
            }          
            dom.byId("container_search_results").style = "display:none";
            dom.byId("container_result_details").style = "display:visible";
            var signal = on(dom.byId("container_result_details"), "click", function(e){
              dom.byId("container_search_results").style = "display:visible";
              dom.byId("container_result_details").style = "display:none";
              signal.remove();
            });
            query("#result_detail_main .row a[data-details-zoom]").on("click", lang.hitch(this, function(evt) {
              evt.stopPropagation();
              var rcid = evt.currentTarget.id.split("_")[1];
              var currentItem;
              for(i=0; i<json_results.length; i++) {
                if (json_results[i].feature.attributes.rcid == rcid) {
                  currentItem = json_results[i];
                  break;
                }
              }
              this._zoomToSelectedFeature(currentItem);
            }));
          }));
          query("#search_result_main .row a[data-details-zoom]").on("click", lang.hitch(this, function(evt) {
            var rcid = evt.currentTarget.id.split("_")[1];
            var currentItem;
            for(i=0; i<json_results.length; i++) {
              if (json_results[i].feature.attributes.rcid == rcid) {
                currentItem = json_results[i];
                break;
              }
            }
            this._zoomToSelectedFeature(currentItem);
          }));
        }
        else {
          query("#search_result_main .row a[data-details-zoom]").on("click", lang.hitch(this, function(evt) {
            var dsnm = evt.currentTarget.id.split("_")[1];
            var currentItem;
            for(i=0; i<json_results.length; i++) {
              if (json_results[i].feature.attributes.DSNM.includes(dsnm)) {
                currentItem = json_results[i];
                break;
              }
            }
            this._zoomToSelectedFeature(currentItem);
          }));
        }
      }
    }
  });
});