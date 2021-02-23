# OpenRCT2-terrain-to-Parkitect
OpenRCT2 plugin to export the scenario's terrain data into Parkitect

Currently exports the height data, land ownership, and terrain types. Tested with OpenRCT2 v0.3.2

This is not very user friendly. Follow these steps. You will need 7zip and preferably Notepad++

Step 1: Launch OpenRCT2 through "openrct2.com" instead of the .exe so the console opens
Step 2: Open the scenario you want to export the terrain of. Under the map icon, click "Write scenario data into console"
Step 3: Your console should have a bunch of characters in it. Copy the console log to a txt file (Ctrl+A to select all and then Ctrl+C)
Step 4: Take note of the map size. Most RCT scenarios seem to be 126x126. Create an empty parkitect scenario with that map size. It **must** be the same map size.
  You cannot save without adding a park entrance and a guest spawner, so I recommend puting it in a corner because you will need to delete it later
  Save and quit the scenario
Step 5: Go to your Parkitect scenarios folder
