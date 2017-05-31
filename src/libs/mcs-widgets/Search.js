define([
  'dojo/text!./templates/Search.html',
  'dojo/dom-construct', 'dojo/on', 'dojo/dom', 'dojo/query',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/json',
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
  'bootstrap/Collapse'
], function(
  template,
  domConstruct, on, dom, query,
  declare,
  lang, array, JSON,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  FindTask, FindParameters,
  Color, SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Point, Polyline, Polygon, Graphic
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // description:
    //    Custom Maritime Search

    templateString: template,
    baseClass: 'mcs-search',
    widgetsInTemplate: true,
    map: null,
    s57ServiceUrl: null,
    symbol: null,
    searchType: null,

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
      if (this.s57Layer) {
        s57ServiceUrl = this.s57Layer.url;
      }
      else
        s57ServiceUrl = "https://localhost:6443/arcgis/rest/services/SampleWorldCities/MapServer/exts/MaritimeChartService/MapServer";
//      s57ServiceUrl = "http://nsdemo.esri.com/arcgis/rest/services/SampleWorldCities/MapServer/exts/Maritime%20Chart%20Service/MapServer";
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
    _onSearchClick: function(e) {

      e.preventDefault();

      //Create Find Task using the URL of the map service to search
      this.findTask = new FindTask(s57ServiceUrl);

      //Create the find parameters
      findParams = new FindParameters();
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

      this.findTask.execute(findParams, lang.hitch(this, this.showFindTaskResults), lang.hitch(this, this.findErrorFindTaskResults));

    },
    showFindTaskResults: function(in_results) {
      this._clearChildNodes(this.search_result_main);
      this.setSearchResults(in_results, 'default');
    },

    findErrorFindTaskResults: function(error) {
console.log(error);
    },


    setSearchResults: function(in_results, type) {
      dom.byId("container_search_results").style = "display:visible";
      dom.byId("container_result_details").style = "display:none";
      if (type == "cell") {
        this.getCellSearchResults_Parser(in_results);
      } else {
        this.getSearchResults_Parser(in_results, this);
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

    getSearchResults_Parser: function(json_results, widgetthis) {
      var array_usage_levels = ["Overview", "General", "Coastal", "Approach", "Harbour", "Berthing", "River", "River harbour", "River berthing", "Overlay", "Bathymetric ENC", "Unknown"];
      var cellName, cellName_trunc, usage_str, usage_val, geometryType;
      var usageCount = [];
      var usageGroups = [];
      var usageIndex = 0, usageGroupIndex = 0;
      var previous_name = "";
      var searchByObjectName = false;

      if (json_results.length > 0) {
        var container, usagegroup, divgroup;

        array.forEach(json_results, function(item_details, i){
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
          if (item_details.foundFieldName == 'OBJNAM') {
            searchByObjectName = true;
            cellName = item_details.feature.attributes.cellName;
            cellName_trunc = cellName.substr(0, ((cellName.length) - 4));
          }
          else {
            cellName = item_details.feature.attributes.DSNM;
            cellName_trunc = cellName.substr(0, ((cellName.length) - 4));
          }
          usage_val = cellName.substr(2, 1);
          if (usage_val == "A") usage_val = "10";
          if (usage_val == "B") usage_val = "11";
          usage_str = array_usage_levels[usage_val - 1];
          if (!usage_str) {
            // if the usage_str is undefined set it to the Unknown category
            usage_str = array_usage_levels[11];
          }
          if (usage_str=="Overlay") 
            console.log(cellName);

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
              }, widgetthis.search_result_main); 

              usagegroup = domConstruct.create("button", {
                'class':"btn",
                'data-toggle':"collapse",
                'data-target':"#container_" + usage_str.replace(" ", "_"),
                innerHTML: usage_str + "&nbsp;&nbsp;&nbsp;&nbsp;<span id='span_" + usage_str + "' class='badge'>0</span>",
                id: 'usage_' + usage_str.replace(" ", "_")  
              }, container); 
              divgroup = domConstruct.create("div", {
                'class': "collapse",
                id: 'container_' + usage_str.replace(" ", "_")
              }, container);
            }
            else {
              counter = usageCount[groupIdx];
              divgroup = dom.byId('container_' + usage_str.replace(" ", "_"));
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
            content += "<div class='col-sm-4 row-actions'><a href='#' class='btn btn-default btn-xs' data-details-button id='details_" + item_details.feature.attributes.rcid + "'><span class='glyphicon glyphicon-info-sign'><span></a><a href='#' class='btn btn-default btn-xs' data-details-zoom id='zoomto_" + item_details.feature.attributes.rcid + "'><span class='glyphicon glyphicon-map-marker'><span></a></div>"
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
                  detailcontent += "<div class='col-sm-4 row-actions'><a href='#' class='btn2 btn-default btn-xs' data-details-zoom id='zoom2_" + item_details.feature.attributes.DSNM.substr(0, ((item_details.feature.attributes.DSNM.length) - 4)) + "'><span class='glyphicon glyphicon-map-marker'><span></a></div>"
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
          dom.byId('span_'+usageGroups[i]).innerHTML = usageCount[i];
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
                if(key.toUpperCase()=='RCID') {
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