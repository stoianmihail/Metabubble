var parsed_url = parse_url(window.location.href);

function increase() {
  let curr = $('#star-counter').html();
  $('#star-counter').html(1 + parseInt(curr));
  $('#star-icon').css('color', '#FFC300');
}

function registerReply(threadID, userUID, stream) {
  console.log('[registerReply] elem=' + elem);

  async function createReply(elem, args) {
    // Fetch the thread id.
    let thread_id = elem;//.id.split('.')[1];
    console.log('trhead_id=' + thread_id)

    // Set the user.
    args['user'] = current_user;

    // Get a key for a new invoice.
    let key = db.ref(`posts/${thread_id}`).child('responses').push().key;
  
    console.log('key=' + key);

    console.log(args);

    // And update.
    let updates = {};
    updates['/posts/' + thread_id + '/responses/' + key] = args;
    return [thread_id, db.ref().update(updates)];
  }

  disableScreen();
  createReply(threadID, {
    content : stream,
    timestamp : getTimestamp()
  }).then((ret) => {
    console.log(ret);
    // Delete the element.
    // deleteElement(document.getElementById(`response.${ret[0]}`));

    // Reset thread.
    // renderThread(ret[0]).then(() => {
    enableScreen();
    // });
  });
}

async function renderThread(thread_id) {
  // Init the thread.
  $('#thread').html('');
  
  const snap = await db.ref(`posts/${thread_id}`).once('value');

  console.log(snap.val());

  let userUID = snap.val().user.uid;  

  d = {
    'name' : `@${snap.val().user.username}`,
  }
  
  Swal.fire({
    title: `Suggest <a>${d['name']}</a> a stream:`,
    input: 'select',
    inputOptions: {
      'Manifest': 'Manifest',
      'Love Is Blind': 'Love Is Blind',
      'The Good Nurse': 'The Good Nurse',
      'Falling For Christmas' : 'Falling For Christmas',
      'The Crown' : 'The Crown'
    },
    inputPlaceholder: '...',
    showCancelButton: true,
    inputValidator: function (value) {
      return new Promise(function (resolve, reject) {
        if (value !== '') {
          resolve();
        } else {
          resolve('You need to select a Tier');
        }
      });
    }
  }).then(function (result) {
    if (result.isConfirmed) {
      console.log('result confirmed=' + thread_id);
      registerReply(thread_id, userUID, result.value);

      // debugger;

      let myElem = document.getElementById('much');
      // let curr = parseInt(myElem);
      // console.log(curr);
      myElem.innerHTML = `Today: 4 votes left`;
      // $(`#much`).

      Swal.fire({
        icon: 'success',
        html: `Let's see whether ${d['name']} will watch <i>${result.value}</i>!`
      });

      // elem.toggle('slow');
    }
  });
}

async function executeCollapse(id, elem) {
  await renderThread(id, elem);
}

var curr = undefined;

function wrapper(elem) {
  let id = $(`#${elem}`).attr('id');
  console.log('my id=' + id)
  executeCollapse(id, elem);
}

// function activateToggles() {
//   $('[data-toggle="modal"]').click(function() {
//     wrapper($(this));
//   });
// }

function getIcons(ls) {
  console.log(ls);
  active = {
    'history' : 1,
    'comedy' : 1,
    'action' : 1,
    'detective' : 1,
    'musical' : 1,
    'romantic' : 1,
    'sci-fi' : 1,
    'adventure' : 1,
    'pirate' : 1
  }

  html = ``
  for (elem of ls) {
    if (elem in active) {
      html += `<img id='test-icon' src="assets/img/icons/${elem}.png" class="rounded-circle" width="50" alt="User" />`;
    }
  }
  return html;
}

  
// <!-- ${(tagsWithColors.length) ? '<p>Tags: ' + tagsWithColors.join(' ') + '<p>' : ''} -->
                
/* <img id='test-icon' src="assets/img/icons/history.png" class="rounded-circle" width="50" alt="User" /> */
                
function renderForum() {
  function get_last_reply(responses) {
    if (!responses)
      return undefined;
    let max = -1;
    let best = undefined;
    for (id in responses) {
      if (responses[id].timestamp > max) {
        max = responses[id].timestamp;
        best = id;
      }
    }
    return responses[best];
  }

  db.ref('posts').once('value', snap => {
    Promise.all(Object.keys(snap.val() ? snap.val() : {}).map(key => fetchProfile(key, snap.val()[key])))
    .then((ret) => {
      ret.sort(function(first, second) {
        return second.snap.timestamp - first.snap.timestamp;
      });

      // console.log(ret);

      function contains(tags, needle) {
        // console.log(needle);
        // console.log(tags.split(','));
        // console.log(tags.split(',').includes(needle));
        return tags.split(',').includes(needle);
      }
      let taken = {
        'sample' : 1,
        'magnets' : 1,
        'cryocooler' : 1,
        'vibrations' : 1,
      }

      forum = [];
      for (elem of ret) {
        let dict = elem.snap;
        let shown_content = text2html(dict.content);
        let num_eyes = Math.floor(Math.random() * 1000);

        let tags = [];
        for (tag of dict.tags.split(',')) {
          tags.push(tag);
        }

        // console.log('tags=' + tags);
        // if (dict.tags.length) {
        //   for (tag of dict.tags.split(',')) {
        //     tagsWithColors.push(`<mark style='background: #F5F5F5; border-radius: 5px;'>#${tag}</mark>`);
        //   }
        // }

        let img_html = ``;
        // for (const key in taken) {
        //   if (taken[key] === 1) {
        //     // console.log('key=' + key + ' containes=' + contains(dict.tags, key));
        //     if (contains(dict.tags, key)) {
        //       img_html = `<img class="post_img" src="assets/img/${key}-post.png"/>`;
        //       taken[key] = 0;
        //       break;
        //     }
        //   }
        // }

        let add_info = '';
        if (dict.responses) {
          console.log('what? ' + elem.snap.user.uid)
          let last_reply = get_last_reply(dict.responses);
          add_info = `<p class="text-muted"><a href="javascript:void(0)">${last_reply.user.username}</a> replied <span class="text-secondary font-weight-bold">${explainTime(last_reply.timestamp, 'ago')}</span></p>`;
        } else {
          add_info = `<p class="text-muted"><a href="javascript:void(0)">${elem.snap.user.username}</a> posted <span class="text-secondary font-weight-bold">${explainTime(dict.timestamp, 'ago')}</span></p>`;
        }

        forum.push(
          `<div class="card mb-2">
            <div class="card-body">
              <div class="media forum-item">
                <a class="card-link" onclick="wrapper('${elem.id}');">
                  <img id='profile.${elem}' src="${elem.url}" class="rounded-circle" width="50" alt="User" />
                  <small class="d-block text-center text-muted"></small>
                </a>
                <div id='${elem.id}' data-img='${img_html}' class="media-body ml-3" href="#" onclick="wrapper('${elem.id}');" data-target=".forum-content" class="text-body">
                  <a href="javascript:void(0)" class="text-secondary">${elem.snap.user.username}</a>
                  <h6>${dict.title}</h6>
                  <div class="mt-3 font-size-sm">
                    <p>${shown_content}</p>
                  </div>
                  ${img_html}
                  <div id='status.${elem.id}'>${add_info}</div>
                  <p>Tags: ${getIcons(tags)}</p>
                </div>
                <div class="text-muted small text-center">
                  <span class="d-none d-sm-inline-block"><i class="far fa-eye"></i> ${num_eyes}</span>
                </div>
              </div>
            </div>
          </div>`);
      }

      // Build the forum.
      $('#forum').html(forum.join('\n'));
  
      for (elem of ret) {
        db.ref('posts').child(elem.id).on('value', snap => {
          // No snap?
          if (!snap.exists()) return;

          // console.log('[refresh] snap=' + snap.val());

          // Refresh the status.
          let add_info = '';
          if (snap.val().responses) {
            let last_reply = get_last_reply(snap.val().responses);
            console.log(last_reply);
            add_info = `<p class="text-muted"><a href="javascript:void(0)">@${last_reply.user.username}</a> suggested a stream <span class="text-secondary font-weight-bold">${explainTime(last_reply.timestamp, 'ago')}</span></p>`;
          } else {
            add_info = `<p class="text-muted"><a href="javascript:void(0)">@${snap.val().user.username}</a> asked for a stream <span class="text-secondary font-weight-bold">${explainTime(snap.val().timestamp, 'ago')}</span></p>`;
          }

          // And reset the html.
          document.getElementById(`status.${snap.key}`).innerHTML = add_info;
        });
      }

      // Activate toggles.
      // activateToggles();
    });
  });
}

renderForum();