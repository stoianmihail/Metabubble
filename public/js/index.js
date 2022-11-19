var parsed_url = parse_url(window.location.href);

function increase() {
  let curr = $('#star-counter').html();
  $('#star-counter').html(1 + parseInt(curr));
  $('#star-icon').css('color', '#FFC300');
}

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
                    <p>Actions: <button class="btn-sm btn" onclick="increase();"><i id="star-icon" class="far fa-star"></i> Star (<span id="star-counter">${num_stars}</span>)</button><button class="btn-sm btn"><i class="far fa-bookmark"></i> Bookmark</button></p>
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
    let img = $(this).attr("data-img");
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
      for (elem of ret) {
        let dict = elem.snap;
        let shown_content = text2html(dict.content);
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
            console.log('key=' + key + ' containes=' + contains(dict.tags, key));
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

      // Build the forum.
      $('#forum').html(forum.join('\n'));
  
      for (elem of ret) {
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