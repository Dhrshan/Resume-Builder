// ---- Live preview logic and client-side storage (demo) ----
(function(){
  // elements
  const nameInput = document.getElementById('name');
  const roleInput = document.getElementById('role');
  const summaryInput = document.getElementById('summary');
  const skillsInput = document.getElementById('skills');
  const educationInput = document.getElementById('education');
  const projectsInput = document.getElementById('projects');        // ✅ Added
  const experienceInput = document.getElementById('experience');
  const additionalInput = document.getElementById('additional');    // ✅ Added

  const previewName = document.getElementById('previewName');
  const previewRole = document.getElementById('previewRole');
  const previewSummary = document.getElementById('previewSummary');
  const previewSkills = document.getElementById('previewSkills');
  const previewEducation = document.getElementById('previewEducation');
  const previewProjects = document.getElementById('previewProjects');   // ✅ Added
  const previewExperience = document.getElementById('previewExperience');
  const previewAdditional = document.getElementById('previewAdditional'); // ✅ Added

  // load saved resume for logged-in demo user (localStorage)
  function loadSaved(){
    const session = localStorage.getItem('rb_session'); // demo session flag: email
    if(!session) {
      // not logged in: redirect to login
      window.location.href = 'index.html';
      return;
    }
    const saved = JSON.parse(localStorage.getItem('rb_resume_' + session) || 'null');
    if(saved){
      nameInput.value = saved.name || '';
      roleInput.value = saved.role || '';
      summaryInput.value = saved.summary || '';
      skillsInput.value = (saved.skills || []).join(', ');
      educationInput.value = (saved.education || []).join(', ');
      projectsInput.value = (saved.projects || []).join(', ');          // ✅ Added
      experienceInput.value = (saved.experience || []).join(', ');
      additionalInput.value = (saved.additional || []).join(', ');      // ✅ Added
      updatePreview();
    }
  }

  // update preview function
  function updatePreview(){
    previewName.textContent = nameInput.value || 'Your Name';
    previewRole.textContent = roleInput.value || 'Your Role';
    previewSummary.textContent = summaryInput.value || 'Professional summary...';

    // helper to populate list
    function populateList(el, str){
      el.innerHTML = '';
      if(!str) return;
      str.split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        el.appendChild(li);
      });
    }

    populateList(previewSkills, skillsInput.value);
    populateList(previewEducation, educationInput.value);
    populateList(previewProjects, projectsInput.value);       // ✅ Added
    populateList(previewExperience, experienceInput.value);
    populateList(previewAdditional, additionalInput.value);   // ✅ Added
  }

  // save current resume to localStorage under demo session
  function saveResume(){
    const session = localStorage.getItem('rb_session');
    if(!session) return alert('Not logged in (demo).');
    const data = {
      name: nameInput.value,
      role: roleInput.value,
      summary: summaryInput.value,
      skills: (skillsInput.value || '').split(',').map(s => s.trim()).filter(Boolean),
      education: (educationInput.value || '').split(',').map(s => s.trim()).filter(Boolean),
      projects: (projectsInput.value || '').split(',').map(s => s.trim()).filter(Boolean),   // ✅ Added
      experience: (experienceInput.value || '').split(',').map(s => s.trim()).filter(Boolean),
      additional: (additionalInput.value || '').split(',').map(s => s.trim()).filter(Boolean) // ✅ Added
    };
    localStorage.setItem('rb_resume_' + session, JSON.stringify(data));
    alert('Saved locally for demo user.');
  }

  // event listeners
  [nameInput, roleInput, summaryInput, skillsInput, educationInput, projectsInput, experienceInput, additionalInput].forEach(inp => {
    inp && inp.addEventListener('input', updatePreview);
  });

  document.getElementById('saveBtn').addEventListener('click', saveResume);

  document.getElementById('logoutBtn').addEventListener('click', function(){
    localStorage.removeItem('rb_session');
    window.location.href = 'index.html';
  });

  // client-side PDF download (simple)
  document.getElementById('downloadBtn').addEventListener('click', async function(){
    // basic check
    if(!nameInput.value) return alert('Enter a name before downloading.');

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      // Styling mimic: violet headings
      doc.setFontSize(22);
      doc.setTextColor('#6a1b9a');
      doc.text(nameInput.value, 40, 60);

      doc.setFontSize(14);
      doc.setTextColor('#8e24aa');
      doc.text(roleInput.value || '', 40, 90);

      doc.setFontSize(11);
      doc.setTextColor('#222');
      doc.text('Summary:', 40, 120);
      doc.setFontSize(10);
      doc.text(summaryInput.value || '', 40, 138, { maxWidth: 520 });

      let y = 190;
      function writeList(title, csv){
        if(!csv) return;
        doc.setFontSize(12);
        doc.setTextColor('#6a1b9a');
        doc.text(title, 40, y);
        y += 16;
        (csv.split(',').map(s => s.trim()).filter(Boolean)).forEach(item => {
          doc.setFontSize(10);
          doc.setTextColor('#222');
          doc.text('• ' + item, 52, y);
          y += 14;
        });
        y += 8;
      }

      writeList('Skills', skillsInput.value);
      writeList('Education', educationInput.value);
      writeList('Projects', projectsInput.value);               // ✅ Added
      writeList('Experience', experienceInput.value);
      writeList('Additional Information', additionalInput.value); // ✅ Added

      doc.save((nameInput.value || 'resume') + '_Resume.pdf');
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF in this browser.');
    }
  });

  // initial load
  loadSaved();
})();
