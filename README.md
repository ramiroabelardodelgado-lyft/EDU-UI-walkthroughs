README

This Figma plugin uses EDU-UI components to quickly mockup ui walkthroughs, this plugin exports
a zip file containing pngs and a json file.
The pngs are from selected frames or frames under a selected Figma "Section" using a 1290x2796 image resolution settings setting. 
The json contains each of the EDU-UI Components position, size and name, as well as the original Frame size.
The zip file should be unzipped in order to be read by the AE_Walkthroughs.jsx after effects script.

Changelog

### [V.17] - YYYY-MM-DD

#### Added

* Support for different original frame sizes (393px or 1290px width for Figma files or simulator).

### [V.16] - YYYY-MM-DD

#### Added

* Changelog with H and V scrolls
* EDU Figma to AE UI Walkthrough

### [V.15] - YYYY-MM-DD

#### Added

* EDU NLA Figma to AE UI Walkthrough (After Effects Property script)

### [V.13] - YYYY-MM-DD

#### Added

* ZIP file support (Figma plugin)

### [V.01] - YYYY-MM-DD

#### Added

* EDU NLA Mod of Duik's NLA

## To-do List

* Fix NLA animation properties scripted expression
* Change EDU-Highlight animation implementing NLA building blocks
* Add support for stacked highlights or scrolls
* Embed NLA and JSX to the zip file
* Make it template-less (remove the need for the extra "template" file)
