var parsed_url = parse_url(window.location.href);

function increase() {
  let curr = $('#star-counter').html();
  $('#star-counter').html(1 + parseInt(curr));
  $('#star-icon').css('color', '#FFC300');
}

$('#new-discussion_button').on('click', (e) => {
  e.preventDefault();
  e.stopPropagation();

  // Redirect to new topic with the same tag.
  disableScreen();
  let future_location = 'post.html' + ('tag' in parsed_url ? '?tag=' + parsed_url['tag'] : '');
  retrieveCurrentUser((args) => {
    window.location = args['location'];    
  }, {'location' : future_location}, future_location, () => enableScreen());
});

async function renderThread(thread_id, img) {
  // Init the thread.
  $('#thread').html('');

  // Fetch the profile.
  const snap = await db.ref(`posts/${thread_id}`).once('value');

  console.log(snap.val());

  fetchProfile(thread_id, snap.val()).then((ret) => {
    let dict = ret.snap;
    let nl_time = explainTime(dict.timestamp, 'ago');
    let tagsWithColors = [];
    if (dict.tags.length) {
      for (tag of dict.tags.split(',')) {
        tagsWithColors.push(`<mark style='background: #F5F5F5'>#${tag}</mark>`);
      }
    }

    let num_stars = Math.floor(Math.random() * 50);
    $('#thread').html(`
      <div class="card mb-2">
        <div class="card-body">
            <div class="media forum-item">
                <a href="javascript:void(0)" class="card-link">
                    <img src="${ret.url}" class="rounded-circle" width="50" alt="User" />
                    <small class="d-block text-center text-muted"></small>
                </a>
                <div class="media-body ml-3">
                    <a href="javascript:void(0)" class="text-secondary">${ret.snap.user.username}</a>
                    <small class="text-muted ml-2">${nl_time}</small>
                    <h5 class="mt-1">${dict.title}</h5>
                    <div class="mt-3 font-size-sm">
                        <p>${text2html(dict.content)}</p>
                    </div>
                    <div style="margin-bottom: 10px;">${img}</div>
                    ${(tagsWithColors.length) ? '<p>Tags: ' + tagsWithColors.join(' ') + '<p>' : ''}
                    <p>Actions: <button class="btn-sm btn" onclick="increase();"><i id="star-icon" class="far fa-star"></i> Star (<span id="star-counter">${num_stars}</span>)</button><button class="btn-sm btn"><i class="far fa-bookmark"></i> Bookmark</button><button id='${thread_id}' class="btn-sm btn" onclick='reply(this);'><i class="fa fa-reply"></i> Reply</button></p>
                </div>
                <div class="text-muted small text-center">
                    <span class="d-none d-sm-inline-block"><i class="far fa-eye"></i> 19</span>
                    <span><i class="far fa-comment ml-2"></i> 3</span>
                </div>
            </div>
        </div>
    </div>`);

    // And then the profile of the users within the responses.
    Promise.all(Object.keys(dict.responses ? dict.responses : {}).map(key => fetchProfile(key, dict.responses[key])))
    .then((ret) => {
      ret.sort(function(first, second) {
        return -(second.snap.timestamp - first.snap.timestamp);
      });

      for (elem of ret) {
        let response = elem.snap;
        let local_time = explainTime(response.timestamp, 'ago');
        $(`#thread`).append(`
          <div class="card mb-2">
            <div class="card-body">
              <div class="media forum-item">
                <a href="javascript:void(0)" class="card-link">
                  <img src="${elem.url}" class="rounded-circle" width="50" alt="User" />
                  <small class="d-block text-center text-muted"></small>
                </a>
                <div class="media-body ml-3" style="margin-left: 50px;">
                  <a href="javascript:void(0)" class="text-secondary">${elem.snap.user.username}</a>
                  <small class="text-muted ml-2">${local_time}</small>
                  <div class="mt-3 font-size-sm">
                    <p>${text2html(response.content)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>`);
      }
    });
  });
}

function registerReply(elem) {
  async function createReply(elem, args) {
    // Fetch the thread id.
    let thread_id = elem.id.split('.')[1];
    console.log('trhead_id=' + thread_id)

    // Set the user.
    args['user'] = current_user;

    // Get a key for a new invoice.
    let key = db.ref(`posts/${thread_id}`).child('responses').push().key;
  
    // And update.
    let updates = {};
    updates['/posts/' + thread_id + '/responses/' + key] = args;
    return [thread_id, db.ref().update(updates)];
  }

  disableScreen();
  createReply(elem, {
    content : elem.value,
    timestamp : getTimestamp()
  }).then((ret) => {
    console.log(ret);
    // Delete the element.
    deleteElement(document.getElementById(`response.${ret[0]}`));

    // Reset thread.
    renderThread(ret[0]).then(() => {
      enableScreen();
    });
  });
}

function reply(elem) {
  // Retrieve the user.
  disableScreen();
  retrieveCurrentUser(async (args) => {
    let id = args.id;
    const url = await storage.ref('profiles').child(current_user.uid).getDownloadURL();
  
    $('#thread').append(`
      <div id='response.${id}' class="card mb-2">
          <div class="card-body">
              <div class="media forum-item">
                  <a href="javascript:void(0)" class="card-link">
                      <img src="${url}" class="rounded-circle" width="50" alt="User" />
                      <small class="d-block text-center text-muted"></small>
                  </a>
                  <div class="container no-gutters">
                    <div class="modal-body">
                      <div class="form-group">
                          <div class="textfield-box my-2">
                              <textarea class="form-control textarea-autosize" id="content.${id}" rows="1" placeholder="Enter response.."></textarea>
                          </div><br>
                      </div>
                      <div class="custom-file form-control-sm mt-3" style="max-width: 300px;">
                          <input type="file" class="custom-file-input" id="customFile" multiple="" />
                          <label class="custom-file-label" for="customFile">Attachment</label>
                      </div>
                    </div>
                    <div class="modal-footer">
                        <button id='cancel.${id}' type="button" class="btn btn-light" data-dismiss="modal"
                          onclick='deleteElement(document.getElementById("response.${id}"));'>Cancel</button>
                        <button type="button" class="btn btn-success" id="post_button"
                          onclick='registerReply(document.getElementById("content.${id}"));'>Reply</button>
                    </div>
                  </div>
              </div>
          </div>
      </div>`);

    // Reinitialize textareas.
    $('.textarea-autosize').textareaAutoSize();
  }, { id : elem.id }, window.location.href, () => {});
}

async function executeCollapse(id, img) {
  await renderThread(id, img);
}

var curr = undefined;

function activateToggles() {
  $('[data-toggle="collapse"]').click(function() {
    console.log(curr);
    console.log($(this));
    if ((curr !== undefined) && ($(this).attr('id') == curr)) {
      return;
    }
  
    curr = $(this).attr('id');
    let img = $(this).attr('data-img');
    if (curr !== 'back_button') {
      executeCollapse(curr, img).then(() => {
        curr = undefined;
      });
    } else {
      curr = undefined;
    }
  });
}

function renderForum() {
  function has_tag(tags) {
    if ('tag' in parsed_url)
      return tags.split(',').includes(parsed_url['tag']);
    return true;
  }
  
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

      console.log(ret);

      function contains(tags, needle) {
        console.log(needle);
        console.log(tags.split(','));
        console.log(tags.split(',').includes(needle));
        return tags.split(',').includes(needle);
      }
      let taken = {
        'sample' : 1,
        'magnets' : 1,
        'cryocooler' : 1,
        'vibrations' : 1,
      }

      forum = [];
      filtered = [];
      for (elem of ret) {
        if (!has_tag(elem.snap.tags))
          continue;
        filtered.push(elem);
        let dict = elem.snap;
        let shown_content = dict.content.slice(0, Math.min(dict.content.length, 128)) + '..';
        let num_eyes = Math.floor(Math.random() * 1000);

        let tagsWithColors = [];
        if (dict.tags.length) {
          for (tag of dict.tags.split(',')) {
            tagsWithColors.push(`<mark style='background: #F5F5F5; border-radius: 5px;'>#${tag}</mark>`);
          }
        }

        let img_html = ``;
        for (const key in taken) {
          if (taken[key] === 1) {
            if (contains(dict.tags, key)) {
              img_html = `<img class="post_img" src="assets/img/${key}-post.png"/>`;
              taken[key] = 0;
              break;
            }
          }
        }

        let add_info = '';
        if (dict.responses) {
          let last_reply = get_last_reply(dict.responses);
          add_info = `<p class="text-muted"><a href="javascript:void(0)">${last_reply.user.username}</a> replied <span class="text-secondary font-weight-bold">${explainTime(last_reply.timestamp, 'ago')}</span></p>`;
        } else {
          add_info = `<p class="text-muted"><a href="javascript:void(0)">${elem.snap.user.username}</a> posted <span class="text-secondary font-weight-bold">${explainTime(dict.timestamp, 'ago')}</span></p>`;
        }

        forum.push(
          `<div class="card mb-2">
            <div class="card-body">
              <div class="media forum-item">
                <a href="user.html?uid=${dict.user.uid}" class="card-link">
                  <img id='profile.${elem}' src="${elem.url}" class="rounded-circle" width="50" alt="User" />
                  <small class="d-block text-center text-muted"></small>
                </a>
                <div id='${elem.id}' data-img='${img_html}' class="media-body ml-3" href="#" data-toggle="collapse" data-target=".forum-content" class="text-body">
                  <a href="javascript:void(0)" class="text-secondary">${elem.snap.user.username}</a>
                  <h6>${dict.title}</h6>
                  <div class="mt-3 font-size-sm">
                    <p>${shown_content}</p>
                  </div>
                  ${img_html}
                    <div id='status.${elem.id}'>${add_info}</div>
                    ${(tagsWithColors.length) ? '<p>Tags: ' + tagsWithColors.join(' ') + '<p>' : ''}
                  </div>
                  <div class="text-muted small text-center">
                    <span class="d-none d-sm-inline-block"><i class="far fa-eye"></i> ${num_eyes}</span>
                    <span><i class="far fa-comment ml-2"></i> 3</span>
                  </div>
                </div>
              </div>
            </div>`);
      }

      // Add arrows.
      forum.push(`
        <ul class="pagination pagination-sm pagination-circle justify-content-center mb-0">
          <li class="page-item disabled">
            <span class="page-link has-icon"><i class="material-icons">chevron_left</i></span>
          </li>
          <li class="page-item active"><a class="page-link" href="javascript:void(0)">1</a></li>
          <li class="page-item"><span class="page-link">2</span></li>
          <li class="page-item"><a class="page-link" href="javascript:void(0)">3</a></li>
          <li class="page-item">
            <a class="page-link has-icon" href="javascript:void(0)"><i class="material-icons">chevron_right</i></a>
          </li>
        </ul>`);

      // Build the forum.
      $('#forum').html(forum.join('\n'));
  
      for (elem of filtered) {
        db.ref('posts').child(elem.id).on('value', snap => {
          // No snap?
          if (!snap.exists()) return;

          console.log('[refresh] snap=' + snap.val());

          // Refresh the status.
          let add_info = '';
          if (snap.val().responses) {
            let last_reply = get_last_reply(snap.val().responses);
            add_info = `<p class="text-muted"><a href="javascript:void(0)">${last_reply.user.username}</a> replied <span class="text-secondary font-weight-bold">${explainTime(last_reply.timestamp, 'ago')}</span></p>`;
          } else {
            add_info = `<p class="text-muted"><a href="javascript:void(0)">${snap.val().user.username}</a> posted <span class="text-secondary font-weight-bold">${explainTime(snap.val().timestamp, 'ago')}</span></p>`;
          }

          // And reset the html.
          document.getElementById(`status.${snap.key}`).innerHTML = add_info;
        });
      }

      // Activate toggles.
      activateToggles();
    });
  });
}

renderForum();