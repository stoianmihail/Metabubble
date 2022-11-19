const ACCOUNTING_COMPANY = 1;

// The current user.
var current_user = { 'uid' : undefined, 'username' : undefined };
var user_snap = undefined;

function resetCurrentUser() {
  current_user = { 'uid' : undefined, 'username' : undefined };
  user_snap = undefined;
}

// Set the profile image.
if (document.getElementById('profile_image')) {
  retrieveCurrentUser(async () => {
    let parsed_url = parse_url(window.location.href);
    let uid = ('uid' in parsed_url ? parsed_url.uid : current_user.uid);

    // Check whether we're on the user page.
    if (parsed_url['page'].startsWith('user.html')) {
      // Another user?
      if (uid !== current_user.uid) {
        db.ref('users').child(parsed_url.uid).once('value', snapshot => {
          if (snapshot.exists()) {            
            $('#about_username').html('@' + snapshot.val().username);
            $('#about_fullname').html(snapshot.val().fullname);
            $('#about_academia').html(snapshot.val().title);
          } else {
            console.log('Snapshot doesn\'t exist!');
          }
        }).catch((e) => {
          console.log(e);
        });
      } else {
        $('#about_username').html('@' + current_user.username);
        if (user_snap) {
          $('#about_fullname').html(user_snap.fullname);
          $('#about_academia').html(user_snap.title);
        }
      }
    }

    // Common login utils.
    $("#sign_out").css('display', 'inline-block');
    const profile = await storage.ref('profiles').child(current_user.uid).getDownloadURL();
    $('#profile_image').attr('src', profile);
    $('#profile_image').addClass('img-thumbnail');
    if (document.getElementById("about_image")) {
      if (uid !== current_user.uid) {
        const other_profile = await storage.ref('profiles').child(uid).getDownloadURL();
        $('#about_image').attr('src', other_profile);
      } else {
        $('#about_image').attr('src', profile);
      }
      $('#about_image').addClass('img-thumbnail');
    }
  }, {}, undefined, () => {}, askUserForLogin=false, restoreScreen=false)
}

function deleteElement(elem) {
  elem.parentNode.removeChild(elem);
}

function tag2color(tag) {
  console.log('inside: ' + tag);
  console.log('inside: ' + (tag === 'temperature'));
  if (tag.startsWith('temp')) {
    return '#4adede';
  } else if (tag.startsWith('magnet')) {
    return '#a6a6a6';
  } else if (tag === 'vibrations') {
    return 'pink';
  } else if (tag === 'sample') {
    return '#e1cbb1';
  } else {
    return 'yellow';
  }
}

// Fetch the user.
function retrieveCurrentUser(callback, args, page, callfront,
  // Optional arguments.
  askUserForLogin=true, restoreScreen=true,
  // Internal arguemnts, not relevant.
  isValid=true) {
  console.log('inseddsasasdadsad');

  auth.onAuthStateChanged(firebaseUser => {
    // Do we still have an user?
    if (firebaseUser) {
      // Check if the request is still valid.
      if (!isValid) return;
      isValid = false;
      
      db.ref('users').child(firebaseUser.uid).once('value', snapshot => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
          current_user = { uid : firebaseUser.uid, username : snapshot.val().username };
          user_snap = snapshot.val();          
          if (callback[Symbol.toStringTag] === 'AsyncFunction') {
            callback(args).then(() => {
              callfront();
            });
          } else {
            callback(args);
            if (restoreScreen)
              enableScreen();
          }
        } else {
          console.log('Snapshot doesn\'t exist!');
        }
      }).catch((e) => {
        console.log(e);
      });
    } else {
      // Reset the current user.
      resetCurrentUser();

      // Enable the screen (if asked)
      if (restoreScreen)
        enableScreen();

      if (askUserForLogin) {
        swal({
          title: `You're currently not logged in.`,
          text: "Do you want to login?",
          icon: "warning",
          buttons: [
            'No',
            'Yes'
          ]
        }).then(function(isConfirm) {
          if (isConfirm) {
            window.location = 'login.html?return=' + page;
            return;
          }

          window.location = 'index.html';
        });
      }
    }
  });
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getPosition(string, subString, index) {
  return string.split(subString, index).join(subString).length;
}

function prettify(invoiceName) {
  return invoiceName.slice(getPosition(invoiceName, '_', 2) + 1, invoiceName.length);
}

async function fetchProfile(id, snap, isUser=false) {
  let uid = isUser ? id : snap.user.uid;
  profile = await storage.ref('profiles').child(uid).getDownloadURL();
  return {'id' : id, 'snap' : snap, 'url' : profile};
}

function exportData(folderName, target_uid, target_company) {
  // Disable screen.
  disableScreen();

  db.ref('folders').child(target_uid + '/' + folderName).once('value', snap => {
    if (!snap.exists()) {
      // TODO: inform the user!
      enableScreen();
      return;
    }

    // TODO: detect errors and enable the screen in those cases.
    Promise.all(snap.val().map(invoiceId => fetchInvoice(invoiceId, false)))
    .then((ret) => {
      let data = [];
      for (let index = 0; index !== ret.length; ++index) {
        let local_data = ret[index].snap.data;
        data.push({
          "id" : (index + 1),
          "supplier": local_data.supplier,
          "order no." : local_data.number,
          "date" : local_data.date,
          "total" : (local_data.total ? local_data.total[1] : "0")
        });
      }

      // And build the excel.
      const file_type = 'xlsx';
      const ws = XLSX.utils.json_to_sheet(data, {sheet: "Data"});
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'test');
      let fileName = folderName + '.' + file_type;
      if (target_company !== current_user.company)
        fileName = target_company + '_' + fileName;
      XLSX.writeFile(wb, fileName);

      // And enable the screen.
      enableScreen();
    });
  });
}

async function buildFolder(folderName, folderContent, target_uid, target_company) {
  const ret = await Promise.all(Array.from(folderContent).map(invoiceId => fetchInvoice(invoiceId, true)));
  const field_order = ['supplier', 'number', 'date', 'total'];

  function buildDataPreview(data) {
    return Array.from(field_order).map(field => {
      if (field !== 'total') {
        return `<p><code>${capitalizeFirstLetter(field)}: </code>${data[field]}</p>`;
      } else {
        // TODO: add also currency (back-end should support it better)
        // Get only the total.
        return `<p><code>${capitalizeFirstLetter(field)}: </code>${data[field][1]}</p>`;
      }
    }).join('\n');
  }

  function buildIronStatus(status) {
    let iron_status = undefined;
    if (parseInt(status) == 1)
      iron_status = {'icon' : 'nc-icon nc-check-2', 'color' : 'green'};
    else if (parseInt(status) == 0)
      iron_status = {'icon' : 'nc-icon nc-refresh-69', 'color' : 'orange'};
    else if (parseInt(status) == -1)
      iron_status = {'icon' : 'nc-icon nc-simple-remove', 'color' : 'red'};
    return iron_status;
  }

  // TODO: put `on.value` for each file!
  function buildAccordionInvoice(dict)
  // Build the accordion for an invoice.
  {
    // Fetch data.
    let data = ``;
    if (parseInt(dict.snap.status) == 1)
      data = buildDataPreview(dict.snap.data);

    // Set the iron status.
    // TODO: fix when status === -1!
    let iron_status = buildIronStatus(dict.snap.status);

    // And create the panel for this invoice.
    let local_panel = `
      <div class="accordion-item">
        <h2 class="accordion-header" id="accordion_${folderName}_${dict.id}">
          <style is = "custom-style">
            .small { height: 20px; width: 20px; }
          </style>
          <button type="button" class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapse_${dict.id}">
          <i id="iron_${dict.id}" class="${iron_status.icon}" style="color: ${iron_status.color};"></i>&nbsp;${dict.name}</button>									  
        </h2>
        <div id="collapse_${dict.id}" class="accordion-collapse collapse" data-bs-parent="#folder_${folderName}">
          <div class="card-body">
            <p><code>Invoice: </code><a href="${dict.url}" target="_blank">Open</a></p>
            <div id="data_${dict.id}">
              ${data}
            </div>
          </div>
        </div>
      </div>`;
    return local_panel;
  }

  // Gather all accordions.
  let invoices = ``;
  let acc_ids = [];
  for (let index = 0; index !== ret.length; ++index) {
    acc_ids.push(ret[index].id);
    invoices += buildAccordionInvoice(ret[index]);
    invoices += `\n`;
  }

  // Add listeners.
  for (let index = 0; index !== acc_ids.length; ++index) {
    db.ref('invoices').child(acc_ids[index]).on('value', snap => {
      // Put data.
      if ($('#data_' + snap.key)) {
        if (parseInt(snap.val().status) === 1) {
          $('#data_' + snap.key).html(buildDataPreview(snap.val().data));
        } else {
          // TODO: what happens when `status === -1`? 
        }
      }

      // Update the iron icon.
      if ($('#iron_' + snap.key)) {
        let iron_status = buildIronStatus(snap.val().status);
        $('#iron_' + snap.key).attr('class', iron_status.icon);
        $('#iron_' + snap.key).css('color', iron_status.color);
      }
    });
  }

  // And build the folder accordion.
  let panel = `
    <div class="accordion-item">
      <h2 class="accordion-header" id="accordion_${folderName}">
        <button type="button" class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapse_${folderName}">${folderName}</button>									
      </h2>
      <div id="collapse_${folderName}" class="accordion-collapse collapse" data-bs-parent="#folders">
        <div class="card-body">
          <button id="excel_${folderName}" onclick='exportData("${folderName}", "${target_uid}", "${target_company}");' class="btn btn-default xls" style="margin-bottom: 25px;">Export</button>
          <div class="accordion" id="folder_${folderName}">
            ${invoices}
          </div>
        </div>
      </div>
    </div>`;
  return panel;
}

// ******************************** S c r e e n  U t i l s ********************************
function disableScreen() {

  console.log('inside disable');
  // Disable the wrapper.
  $('.wrapper').css('pointer-events', 'none');
  
  // Alternative:
  // $('.sidebar').css('pointer-events', 'none');
  // document.getElementsByTagName('body')[0].style.pointerEvents = 'none'
  
  // Enable loader.
  $('#loader').css('display', 'block');
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function release() {
  // Enable the wrapper.
  $('.wrapper').css('pointer-events', '');
}

function enableScreen() {
  console.log('inside enable');
  $('#loader').css('display', 'none');
  release();
}

// ******************************** U R L  U t i l s ********************************
function parse_url(url) {
  if (url.indexOf('?') === -1)
    return {'page' : url.slice(1 + url.lastIndexOf('/'))};
  let split = url.substring(url.indexOf('?') + 1).split('&');
  let parsed = {
    'page' : url.slice(1 + url.lastIndexOf('/'), url.indexOf('?'))
  };
  split.forEach(element => {
    let content = element.split('=', limit=1);
    parsed[content[0]] = element.substring(element.indexOf('=') + 1);
  });
  return parsed;
}

// ******************************** T e x t  U t i l s ********************************

function text2html(text) {
  return text.replaceAll('\n', '<br>');
}

// ******************************** T i m e  U t i l s ********************************

function getTimestamp() {
  return + new Date();
}

function explainTime(time, suffix) {
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  let dict = {
    0: {'ms' : 1000, 'text' : 'second'},
    1: {'ms' : msPerMinute, text : 'minute'},
    2: {'ms' : msPerHour, text : 'hour'},
    3: {'ms' : msPerDay, text : 'day'},
    4: {'ms' : msPerMonth, text : 'month'},
    5: {'ms' : msPerYear, text : 'year'}
  };

  var elapsed = getTimestamp() - time;
  if (elapsed < msPerMinute)
    ret = 0;
  else if (elapsed < msPerHour)
    ret = 1;   
  else if (elapsed < msPerDay)
    ret = 2;   
  else if (elapsed < msPerMonth)
    ret = 3;   
  else if (elapsed < msPerYear)
    ret = 4;   
  else
    ret = 5;
  let total = Math.round(elapsed / dict[ret].ms);
  if ((ret == 0) && (total === 0))
    return 'a moment' + ' ' + suffix;
  return ((ret >= 3) ? 'approximately' : '') + ' ' + total + ' ' + dict[ret].text + (total !== 1 ? 's' : '') + ' ' + suffix;
}

// ******************************** L o g i n  U t i l s ********************************
var hasIssuedSignOut = false;
$('#close-button').on('click', e => {
  e.stopPropagation();
  e.preventDefault();

  hasIssuedSignOut = true;
  auth.signOut()
  .then(() => {
    window.location = 'index.html';
  });
});

