export function generateReport(data) {
  const date = new Date().toLocaleString();

  let html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
SECURITY AUDIT REPORT REPORT
</title>


<style>

body{

background:#050505;

color:#eee;

font-family:system-ui;

padding:30px;

}


h1{

color:#00ff88;

}


.card{

background:#111;

padding:20px;

border-radius:12px;

margin:15px 0;

}


.row{

display:flex;

justify-content:space-between;

padding:8px;

border-bottom:1px solid #333;

}


</style>


</head>


<body>


<h1>
Security Audit
</h1>


<p>
Generated:
${date}
</p>


<div class="card">

<h2>
Security Score
</h2>


<h1>
${data.score}/100
</h1>


</div>


`;

  for (const section in data.sections) {
    html += `

<div class="card">


<h2>
${section}
</h2>


`;

    for (const item in data.sections[section]) {
      html += `

<div class="row">

<span>
${item}
</span>

<span>
${data.sections[section][item]}
</span>


</div>

`;
    }

    html += `
</div>
`;
  }

  html += `

</body>

</html>

`;

  const blob = new Blob([html], {
    type: "text/html",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "xSecurity_Audit_Report.html";

  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
