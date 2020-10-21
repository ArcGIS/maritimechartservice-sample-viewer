20201021 - Latest release with support through 10.8.1


# Maritime Chart Service sample widgets
## (Web App Builder widgets)


The Maritime Chart Service widgets are widgets and dojo classes that illustrate how web applications can consume and interact with the Maritime Chart Service exposed by the ArcGIS Maritime Sever Extension product https://www.esri.com/en-us/arcgis/products/arcgis-maritime/deployment/server-extension

The widgets can be used directly within Web App Builder for ArcGIS. Alternatively, the source code for these widgets is available here for reuse/modification and to integrate it within custom web apps outside of the Web App Builder for ArcGIS framework.

To view a sample application created with these widgets please visit http://esriho.maps.arcgis.com/home/index.html and click on one of the Maritime Chart Service applications.

Note: Only MCS mapserver services are supported with these widgets.


## * What's new with this version
* Added multiple MCS service support to Display Properties, Identify, and Search widgets.
* Updated Display Properties configuration steps to support multiple MCS services.

With added support for multiple MCS services you can now author a map with one or more MCS services and use all three sample widgets with each service.  Even if you use the Add Data widget to add another MCS service to your map, you can refresh your MCS sample widgets to recognize and work with any newly added MCS service.

## * Added new Multiple MCS Services support section under deployment
## * Tested against WAB 2.17 and JavaScript API 3.29

Items included with previous release (20190502)
## * Added support for the following display parameters
* Safe Depth
* Display Light Sectors
* Display AIO Features
* Display Safe Soundings
* Date Dependency Symbol (new as of 20190502)
* Date Dependency Range  (new as of 20190502)
* Updated identify to automatically send display_params in the request.  This will ensure that every identify request honors any changes to the Date Dependency Range. (new as of 20190502)



## Sections

* [Features](#features)
* [Requirements](#requirements)
* [Deployment](#deployment)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features

These sample Web App Builder widgets illustrate how to build web apps consuming S-57/S-63 web services published from ArcGIS Maritime Server Extension in a JavaScript web app.
* Allows users to change S-52 based display settings through the JavaScript client
* Enables users to identify on individual features and view their attribute information.
* Provides the ability to search based on object name (OBJNAM), national object name (NOBJNM) and dataset names.

The Widget Repository currently includes:

### Maritime Chart Service Library

This is a library of custom Esri widgets and custom layer classes that extend Esri's JSAPI in order to consume the Maritime Chart Service in apps. 

### Web App Builder Widgets

The following are custom Web App Builder widgets that use the maritime chart service library above and are to be used within the Web App Builder to create custom apps, templates and themes.

* Maritime Display Properties
* Maritime Identify
* Maritime Search


## Requirements
* Web App Builder for ArcGIS (Developer Edition) 2.10 or greater for the Web App builder widgets.
* Maritime Chart Service widgets require JS API 3.19 or greater. 
* ArcGIS Maritime Server Extension 10.5/10.5.1, 10.6/10.6.1, 10.7/10.7.1, 10.8/10.8.1


## Deployment

Adding Widgets to you Web AppBuilder Environment:

1. If you haven't already, download the latest version of Web AppBuilder for ArcGIS (Developer Edition) and follow the instruction at https://developers.arcgis.com/web-appbuilder/guide/getstarted.htm 
2. Download the Maritime Chart Service widgets by clicking on Download Zip. 
3. To use the widgets, copy the ones you want to use to the Web App Builder widget directory.
  * Copy the contents of the `src\widgets\` folder to `<webappbuilder folder>\client\stemapp\widgets\`
4. The Web App Builder widgets depend on the modules in the libs folder.
  * Copy the contents of `src\libs\` folder to `<webappbuilder folder>\client\stemapp\libs\`
5. Add the following two lines of code in your `<webappbuilder folder>\client\stemapp\init.js` file in two places where dojoConfig.packages are defined. 
```
      {
          name: "bootstrap",
          location: "//rawgit.com/xsokev/Dojo-Bootstrap/master"
      },
```

## Create a Web App using the Maritime Chart Service:
When creating a Web App, you need to choose the Web Map that will be used by the App. In order to use the maritime widgets, make sure that the Web Map you choose contains a Maritime Chart Service layer. This Web Map must first be created and available in your ArcGIS Online account. If you don't have a access to a Web Map that contains the Maritime Chart Service, you can create one in your ArcGIS Online account.

* Log in to your ArcGIS Online account
* Create a new Map
* Click Add -> Add Layer from Web
* Specify a layer containing the Maritime Chart Service

For instance, if you enabled the Maritime Chart Service on the default *SampleWorldCities* layer on a ArcGIS Server instance where the ArcGIS for Maritime: Server is installed, the URL for the layer would look like:

```
	https://[yourmachinename]:6443/arcgis/rest/services/SampleWorldCities/MapServer/exts/MaritimeChartService/MapServer
```
If the machine is in domain, it is sometimes required to include domain name along with the machine name to get started, like 
```
	https://[yourmachinename].[yourdomain]::6443/arcgis/rest/services/SampleWorldCities/MapServer/exts/MaritimeChartService/MapServer
```
## NOTE: WMSServer is not supported by these sample widgets

## NOTE: If your MCS services contain S-63 encrypted datasets, the Identify and Search widget results will not return geometry information due to S-63 legal requirements.  This will change the behavior of the results window for each widget.  For Identify, the zoom to option will zoom into your selection point instead of the feature.  For Search, the zoom to option will be disabled.  S-57 datasets (unencrypted) will not be impacted.

* Save the Web Map

The Web Map is now using the Maritime Chart Service, and can be selected when you create your App in Web AppBuilder

## Multiple MCS Services support
Multiple MCS services support allows you to deploy the sample widgets with a map that contains one or more MCS services.  If you deploy with more than one MCS service, you must set the Display Properties for each service by selecting the service in the drop-down menu and choosing the display parameters you want to expose.  Then you repeat the process for the other MCS services before click done.  There are not additional deployment steps for Identify and Search.

If a user adds another MCS service using the Add Data button after the application has been deployed, all the available display properties for that service will be exposed to the user.  Users must click the refresh button on each MCS sample widget for the newly added service to be available.

Both the Identify and Search widget allow you to select which services you want to use as part of the request.  You can either use Identify and Search on one or all of the available services at once.   The Display Properties widget must be used on one service at a time.  The display options for each service will be retained during your session.

NOTE: There is a known limitation that when you use the add data button to add an MCS Service, you will not be able to remove it.  However, you can uncheck that service from your widgets to keep it from being interacted with.

## Deployment options for Maritime Display Parameters:

When you add the Maritime Display Parameters widget to your application you can now query against all available parameters and select all or just the ones you want to deploy.  

The Maritime Display Parameters widget now comes with a configurable config.json file which allows you to select which controls will be exposed when the user runs query to configure the widget.  There are several display parameters that are hidden by default.  All current parameters are listed below. 

The config.json file can be found under your MaritimeDisplayProperties widget folder.  Starting with 10.6.1 Patch 2 SafetyDepth was added and set to False.  When set to true it will be displayed on the Depth Contours tab below safety contour.  

#### Do not set SafetyDepth to true prior to 10.6.1 Patch 2.  Doing so will break the widget.

DisplaySafeSoundings is dependent on SafetyDepth.  Only set DisplaySafeSounding to true if you set SafetyDepth to true.

The following parameters when set to true will be exposed on a new tab named symbol size.  They are set to false by default.
* AreaSymbolSize
* DatasetDisplayRange
* LineSymbolSize
* PointSymbolSize
* TextSize
 
Current config.json for Display Parameters Widget:
```
{
  "includeParameters": {
    "AreaSymbolizationType": true,
    "AttDesc": true,
    "ColorScheme": true,
    "CompassRose": true,
    "DataQuality": true,
    "DateDependencyRange": true,
    "DateDependencySymbols": true,
    "DeepContour": true,
    "DisplayCategory": true,
    "DisplayAIOFeatures": true,
    "DisplayDepthUnits": true,
    "DisplayFrames": true,
    "DisplayFrameText": true,
    "DisplayFrameTextPlacement": true,
    "DisplayNOBJNM": true,
    "DisplayLightSectors": true,
    "DisplaySafeSoundings": true,
    "HonorScamin": true,
    "IntendedUsage": true,
    "IsolatedDangers": true,
    "LabelContours": true,
    "LabelSafetyContours": true,
    "OptionalDeepSoundings": true,
    "PointSymbolizationType": true,
    "RemoveDuplicateText": false,
    "SafetyContour": true,
    "SafetyDepth": true,
    "ShallowContour": true,
    "ShallowDepthPattern": true,
    "TextHalo": false,
    "TwoDepthShades": true
  },
  "includeParameterGroups": {
    "AreaSymbolSize": false,
    "DatasetDisplayRange": false,
    "LineSymbolSize": false,
    "PointSymbolSize": false,
    "TextGroups": true,
    "TextSize": false
  }
}
```

Please note that there are some exceptions when using these widgets against 10.4/10.4.1, 10.5 and any release prior to 10.6.1 Patch 2
* 10.4/10.4.1 - Text Groups is not supported on the client side so you will need to turn this option off.
* 10.5 - Label Contours is not supported on the client side so you will need to turn this option off.
* Prior to 10.6.1 Patch 2: Do not set SafetyDepth to true prior to 10.6.1 Patch 2.  Doing so will break the widget.

#### Once you enable the use of display parameters, your request URL length will typically exceed the maximum length setting on your server.  MCS supports POST but our sample widgets only support GET. To support the longer URL length when deploying the Display Parameters widget, will need to use a web.config.xml file and increase your URL length.  

## Search widget:

The search widget is now supported on all versions with one exception.  Searching on national object name is only supported in versions 10.5 and greater.


## Additional Deployment steps for the Identify widget:

NOTE: Identify widget will no longer support http://localhost:6080 requests.

If you enable the open this widget automatically when the app starts option, then point identify will be active and you can click on the map without opening the identify widget. 

If you want to resize your Identify widget you will need to add a height and width value to the widget while in the WAB development environment.  

 * Once you have added the Maritime Identify widget to your application and saved that application add the following two lines of code in your <webappbuilder folder>\server\apps\<app number\config.json.

The following two values are a recommended starting point:
```
       "height": 120,
       "width": 265,
 ```
 
 Sample modifcation:
 ```
 {
        "position": {
          "left": 55,
          "top": 45,
		  "height": 120,
		  "width": 265,
          "relativeTo": "map"
        },
        "placeholderIndex": 1,
        "id": "_5",
        "name": "MaritimeIdentify",
        "label": "Maritime Identify",
        "version": "0.0.1",
        "IsController": false,
        "uri": "widgets/MaritimeIdentify/Widget",
        "config": "configs/MaritimeIdentify/config_Maritime Identify.json"
      },
```

* Refresh your application to see the changes.

### General Help
[New to GitHub? Get started here.](https://help.github.com/articles/git-and-github-learning-resources/)

For more resources on developing and modifying widgets please visit
[Web App Builder for ArcGIS (Developer Edition) documentation](https://developers.arcgis.com/web-appbuilder/)

## Resources

* Learn more about Maritime Chart Service, a functionality of the ArcGIS for Maritime: Server product [here](http://server.arcgis.com/en/server/latest/get-started/windows/arcgis-for-maritime-server.htm#).
* [ArcGIS for JavaScript API Resource Center](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)

## Issues

* Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

If you are using [JS Hint](http://www.jshint.com/) there is a .jshintrc file included in the root folder which enforces this style.
We allow for 120 characters per line instead of the highly restrictive 80.

## Licensing

Copyright 2015 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's
[license.txt](license.txt) file.
