const fs = require('fs');
const path = require('path');

const files = [
    'c:/Wezeso/Projects/Teacher Rating/teachers_data_1st_trim.json',
    'c:/Wezeso/Projects/Teacher Rating/teachers_data_2nd _trim.json',
    'c:/Wezeso/Projects/Teacher Rating/teachers_data.json'
];

let allGroups = new Set();
let allData = [];

// Read all files and collect unique groups
for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    allData.push({ file, data });
    for (const teacher of data) {
        if (teacher.groups) {
            for (const group of teacher.groups) {
                allGroups.add(group);
            }
        }
    }
}

const sortedGroups = Array.from(allGroups).sort();
console.log(`Found ${sortedGroups.length} unique groups across all files.`);

// Update "Wezeso" in all files
for (const { file, data } of allData) {
    let wezeso = data.find(t => t.teacherName === 'Wezeso');
    if (wezeso) {
        wezeso.groups = sortedGroups;
        console.log(`Updated Wezeso in ${file}`);
    } else {
        wezeso = {
            "teacherName": "Wezeso",
            "disciplines": ["Swag and Drip of AITU"],
            "groups": sortedGroups
        };
        data.push(wezeso);
        data.sort((a, b) => a.teacherName.localeCompare(b.teacherName));
        console.log(`Added Wezeso to ${file}`);
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

console.log('Update complete.');
