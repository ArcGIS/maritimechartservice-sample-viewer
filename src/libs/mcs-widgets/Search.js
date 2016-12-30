define([
  'dojo/text!./templates/Search.html',
  'dojo/on', 'dojo/dom', 'dojo/query',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-construct',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'esri/tasks/FindTask',
  'esri/tasks/FindParameters',
  'esri/Color',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
   'bootstrap/Collapse'
], function(
  template,
  on, dom, query,
  declare,
  lang, array, domConstruct,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  FindTask, FindParameters,
  Color, SimpleFillSymbol, SimpleLineSymbol
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // description:
    //    Custom Maritime Search

    templateString: template,
    baseClass: 'search',
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
      if (this.resultSymbol) {
        this.symbol = new SimpleFillSymbol(this.resultSymbol);
      } else {
        this.symbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          10,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([98, 194, 204]), 2),
          new Color([98, 194, 204, 0.5])
        );
      }
      if (this.map) {
        this.setMap(this.map);
      }
      s57ServiceUrl = "http://nsdemo.esri.com/arcgis/rest/services/SampleWorldCities/MapServer/exts/Maritime%20Chart%20Service/MapServer";
    },
    setupConnections: function() {
      // summary:
      //    wire events, and such
      //
      console.log('maritime.Search::setupConnections', arguments);

      this.own(on(this.searchtypeSelect, 'change', lang.hitch(this, function() {
        var obj = document.getElementById("container_search_default_text");
        var type = this.searchtypeSelect.value;
        if (type == "cell") {
          obj.innerHTML = "Use the above search box to search for cells based on their Dataset Name (DSNM).";
        } else {
          obj.innerHTML = "Use the above search box to search for features based on their Object Name (OBJNAM) attribute.";
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

      //this.map.graphics.clear();
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
      /*var results = in_results;
      if (results.length > 0) {
        //This function works with an array of FindResult that the task returns
        //map.graphics.clear();
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([98, 194, 204]), 2), new dojo.Color([98, 194, 204, 0.5]));


        //create array of attributes
        _this = this;
        var items = array.map(results, function(result) {
          var graphic = result.feature;
          graphic.setSymbol(symbol);
          _this.map.graphics.add(graphic);
          result.feature.attributes["resultID"] = result.feature.attributes.rcid + result.feature.attributes.cellName;
          return result.feature.attributes;
        });

      } else {
        // Skip
      }*/
      this.setSearchResults(in_results, 'default');
    },

    findErrorFindTaskResults: function(error) {

    },


    setSearchResults: function(in_results, type) {

      query("#accordion").collapse();
      if (type == "cell") {
        this.getCellSearchResults_Parser(in_results);
      } else {
        this.getSearchResults_Parser(in_results);
      }

    },

    sortByName: function(a, b) {
      var aName = a.name.toLowerCase();
      var bName = b.name.toLowerCase();
      return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },

    getSearchResults_Parser: function(json_results) {
      //console.log ("TEST - json_results: "+ json_results);
      //array_results = jQuery.parseJSON(json_results);
      array_results = json_results; //.results;
      //console.log ("TEST - array_results: "+ array_results);

      var array_usage_levels = ["Overview", "General", "Coastal", "Approach", "Harbour", "Berthing", "River", "River harbour", "River berthing", "Overlay", "Unknown"];
      var output_json, output_html;
      var previous_name = "";
      var content_title_id = searchresults_list_id = "";
      var int_OBJNAM_trunc = 18;
      var counter = 1;
      var resultID, layerId, layerName, count, displayFieldName, foundFieldName, value, OBJNAM, OBJNAM_trunc;
      var objectType, objectTypeDescription, rcid, cellName, cellName_trunc, compilationScale, usage_val, usage_str, geometryType;
      var geometry_x, geometry_y;
      var geometry_extent;
      var geometryJson;
      var centerPoint;
      var str_item_details = "";

      if (array_results.length > 0) {

        array.forEach(array_results, function(item_details, i){
          layerId = item_details.layerId;
          layerName = item_details.layerName;
          count = 0; //item_details.count;
          displayFieldName = item_details.displayFieldName;
          foundFieldName = item_details.foundFieldName;
          LName = item_details.feature.attributes.LNAM;
          value = item_details.value;

          // Attributes
          rcid = item_details.feature.attributes.rcid; //item_details.attributes.rcid;
          objectType = item_details.feature.attributes.objectType; //item_details.objectType;
          objectTypeDescription = item_details.feature.attributes.objectTypeDescription;
          OBJNAM = item_details.feature.attributes.OBJNAM;
          OBJNAM_trunc = OBJNAM.substr(0, int_OBJNAM_trunc);
          cellName = item_details.feature.attributes.cellName;
          cellName_trunc = cellName.substr(0, ((cellName.length) - 4));
          compilationScale = item_details.feature.attributes.compilationScale;
          usage_val = cellName.substr(2, 1);
          usage_str = array_usage_levels[usage_val - 1];

          if (!usage_str) {
            // if the usage_str is undefined set it to the Unknown category
            usage_str = array_usage_levels[6];
          }


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

          resultID = rcid + '_' + cellName;


          // Accordion Title ( LI )
          if (previous_name != usage_str) {
            // Increment Counter
            counter = 1;

            output_json = [{
              "output_id": usage_val,
              "output_title": usage_str,
              "output_count": count
            }];

            content_title_id = "list_title_searchresults_" + i;

            jQuery("<li />").attr("id", content_title_id).addClass("section_title section_title_accordion section_subsection display_block background_gray_fade2 border_E5E5E5_1").html(
              jQuery("#template_accordion_top").render(output_json)
            ).appendTo("#accordion_search");

            searchresults_list_id = "searchresults_list_id_" + i;

            output_json = [{
              "searchresults_list_id": searchresults_list_id
            }];

            // Accordion Content ( UL )
            jQuery("<li />").attr("id", "list_content_searchresults_" + i).addClass("list_section_content_results section_content section_content_accordion section_content_wrapper section_subsection display_block").html(
              jQuery("#template_accordion_contents_master").render(output_json)
            ).appendTo("#accordion_search");
          } else {
            // Skip
          }

          // Update Display Counter
          jQuery("#" + content_title_id).find("span.count").html(counter);
          // -----------------------------------------------

          //Reset output_json & output_html
          output_json = output_html = null;

          //      // Parse & Convert JSON to String
          //      console.log("TEST - JSON to String: item_details: "+ item_details );
          //      str_item_details = jQuery.jSONToString(item_details);
          //      console.log("TEST - JSON to String: str_item_details: "+ str_item_details );

          // -----------------------------------------------
          // Accordion Content ( LI )
          //if (geometry_x != null && geometry_y != null) {
          output_json = [{
            "cellName": cellName,
            "cellName_trunc": cellName_trunc,
            "rcid": rcid,
            "LName": value,
            "objName": OBJNAM,
            "objName_trunc": OBJNAM_trunc,
            "objectType": objectType,
            "objectTypeDescription": objectTypeDescription,
            "foundFieldName": foundFieldName,
            "geometryType": geometryType,
            "centerPoint_x": centerPoint.x,
            "centerPoint_y": centerPoint.y,
            "wkid": item_details.feature.geometry.spatialReference.wkid,
            "compilationScale": compilationScale,
            "usage_str": usage_str,
            "geometryJson": JSON.stringify(geometryJson),

            "results_all": [{
              "name": "Dataset",
              "value": cellName_trunc
            }, {
              "name": "Feature",
              "value": objectType
            }, {
              "name": "Description",
              "value": objectTypeDescription
            }, {
              "name": "Geometry",
              "value": geometryType
            }, {
              "name": "Usage",
              "value": usage_str
            }, {
              "name": "Compilation Scale",
              "value": compilationScale
            }, {
              "name": "LName",
              "value": LName
            }],

            "results_extended": []
          }];

          array.forEach(item_details.feature.attributes, function(value, key) {

            //console.log ("Key: "+ key +" / val: "+ value);
            // Create a temporary Array
            // do not add attributes we are already displaying above
            if (key != "objectType" && key != "objectTypeDescription" && key != "LNAM" && key != "compilationScale" && key != "cellName" && key != "rcid" && key != "resultID" && key != "TXTDSC") {
              var object_temp = new Object();
              object_temp["name"] = key;
              object_temp["value"] = value;

              // Add to Output Array
              //output_json[0].results_all.push(object_temp);
              output_json[0].results_extended.push(object_temp);
            } else if (key == "TXTDSC") {
              var object_temp = new Object();
              object_temp["name"] = key;
              object_temp["value"] = value + "," + s57Service.notesUrl + "?f=json&file=" + item_details.feature.attributes.cellPath + value;

              // Add to Output Array
              output_json[0].results_extended.push(object_temp);
            }
          });

          output_json[0].results_extended.push({
            "name": "wkid",
            "value": item_details.feature.geometry.spatialReference.wkid
          });
          output_json[0].results_extended.push({
            "name": "centerPoint_x",
            "value": centerPoint.x
          });
          output_json[0].results_extended.push({
            "name": "centerPoint_y",
            "value": centerPoint.y
          });
          output_json[0].results_extended.push({
            "name": "geometryJson",
            "value": JSON.stringify(geometryJson)
          });
          // sort the extended results
          output_json[0].results_extended.sort(sortByName);

          jQuery("<li />").addClass("searchresults_item").html(
            jQuery("#template_accordion_content").render(output_json)
          ).appendTo("#" + searchresults_list_id);

          // Increment Counter
          counter++;
          // Update previous_name
          previous_name = usage_str;
          // Reset current_title_id
          //searchresults_list_id = "";
          //Reset output_json & output_html
          output_json = output_html = null;
        });
      }
    }

  });
});
