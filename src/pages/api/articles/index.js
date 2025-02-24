
// const handleArticles = async () => {
//     const authToken = process.env.GITHUB_ACCESS_TOKEN;
//     const owner = 'SpandanM110'
//     const repo = '';
//     const path = 'views.json';
//     const commitMessage = 'Update user count';
//     const committerName = 'Spandan Mukherjee';
//     const committerEmail = 'spandanmukherjeegithub@gmail.com';

//     const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

//     // Step 1: Get the SHA of the existing file
//     try {
//         const response1 = await fetch(apiUrl, {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`,
//             }
//         })
//         const data1 = await response1.json();
//         console.log(data1)
//         const fileContent = await JSON.parse(atob(data1.content));
//         const prevCount = fileContent.count;
//         console.log(fileContent.count);
//         const sha = data1.sha;

//         const content = JSON.stringify({count:prevCount+1});

//         console.log('Existing SHA:', sha);

//         // Step 2: Update the file content and SHA
//         const response2 = await fetch(apiUrl, {
//             method: 'PUT',
//             headers: {
//                 'Authorization': `token ${authToken}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 message: commitMessage,
//                 committer: {
//                     name: committerName,
//                     email: committerEmail
//                 },
//                 content: btoa(content), // Encode content as base64
//                 sha: sha // Use the existing SHA for updating
//             })
//         })
//         const updatedData = await response2.json();
//         // const updatedContent = await JSON.parse(updatedData);
//         // console.log(updatedData);
//         return updatedData;
//         // console.log('Updated File:', updatedData);
//     } catch (error) { 
//         console.error('Error fetching file:', error);
//         return {
//             error
//         }
//     }

// };


// export default async function handler(req, res) {
//     try {
//         const result = await (await handleArticles()).json();
//         if(result.error) throw Error(result.error);
//         res.status(200).send({
//             message : "Updated Successfully",
//         });
//     } catch (err) {
//         res.status(500).send({ message: 'Failed to update', err });
//     }
// }