#!/bin/bash

# Local package Installation:
# This require a working package.json
if ! [ -f ./package.json ]; then
	echo "Error: No package.json found!"
	exit 1
fi

echo "Installing request package locally:"
npm install request --save
echo "Installing flow package locally:"
npm install flow --save
echo "Installing chartjs package locally:"
npm install chart.js --save
echo "Installing sslkeylog package locally:"
npm install sslkeylog --save

echo "Required packages successfully installed"
exit 1