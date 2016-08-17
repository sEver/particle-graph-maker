# Particle Graph Builder

This is is a graph constructor originally written on codepen.
It can be used to create elastic sets of nodes connected with vectors.
Example data is provided.


## How to run:

1. Download the repo
2. Open the index.html file in any modern browser


### How to use:
 - use the dat.GUI panel to disable/enable
  - MOUSE_FORCE (the force acting between the cursor and the nodes)
  - ORIGIN_FORCE (the force acting between the node and it's "neutral" position)
 - `Ctrl+drag` a node to move it.
 - `Shift+click` a node to start links (you can start multiple links from different nodes).
  - Click on a node after you've started some links, to attach all your links to that node.
 - `Meta+click` to start an alternative link with different color (on windows Meta is Windows Key).
 - use dat.GUI panel on the right and "addParticle" button to add new node.
  - The new node will spawn attached to your cursor, click anywhere to put it down.
 - to save the graph, use dat.GUI panel storaga->save, the map will be saved to localStorage

Mechanics of particle and approach inspired by
http://codepen.io/soulwire/pen/Ffvlo/

