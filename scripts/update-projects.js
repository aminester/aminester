const fs = require('fs');
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = 'aminester';

async function getTopProjects() {
    try {
        const response = await axios.get(`https://api.github.com/users/${USERNAME}/repos`, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
            },
            params: {
                sort: 'stars',
                per_page: 100,
                type: 'owner'
            }
        });

        // Sort by stars + forks + watchers for better ranking
        const repos = response.data
            .filter(repo => !repo.fork && !repo.private)
            .sort((a, b) => {
                const scoreA = (a.stargazers_count * 2) + a.forks_count + a.watchers_count;
                const scoreB = (b.stargazers_count * 2) + b.forks_count + b.watchers_count;
                return scoreB - scoreA;
            })
            .slice(0, 6); // Top 6 projects

        return repos;
    } catch (error) {
        console.error('Error fetching repos:', error);
        return [];
    }
}

function generateProjectHTML(repos) {
    let html = '<div align="center">\n<table>\n<tr>\n';
    
    repos.forEach((repo, index) => {
        if (index % 3 === 0 && index !== 0) {
            html += '</tr>\n<tr>\n';
        }
        
        html += `<td align="center" width="33%">
<a href="https://github.com/${USERNAME}/${repo.name}">
<img src="https://github-readme-stats.vercel.app/api/pin/?username=${USERNAME}&repo=${repo.name}&theme=dark&hide_border=true&bg_color=1a1b27&title_color=a277ff&icon_color=61ffca" />
</a>
</td>\n`;
    });
    
    html += '</tr>\n</table>\n</div>';
    return html;
}

async function updateReadme() {
    try {
        // Read current README
        let readme = fs.readFileSync('README.md', 'utf8');
        
        // Get top projects
        const projects = await getTopProjects();
        const projectsHTML = generateProjectHTML(projects);
        
        // Update projects section
        const projectsRegex = /<!-- PROJECTS:START -->[\s\S]*<!-- PROJECTS:END -->/;
        readme = readme.replace(projectsRegex, `<!-- PROJECTS:START -->\n${projectsHTML}\n<!-- PROJECTS:END -->`);
        
        // Write updated README
        fs.writeFileSync('README.md', readme);
        console.log('README updated successfully!');
        
    } catch (error) {
        console.error('Error updating README:', error);
    }
}

updateReadme();
