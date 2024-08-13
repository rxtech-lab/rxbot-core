# Compiler

Compiler will compile the source code of the components and generate the output code.
This contains the following steps:

1. Generate the Route map of the components.
    - Find the metadata of the components and include them in the route map.
    - Check if the component is async or not.
2. Compile the components into JavaScript code.
    - Compile the components into JavaScript code.
    - Put them in the output directory follow the same structure as the source code.
