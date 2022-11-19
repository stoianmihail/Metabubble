var parsed_url = parse_url(window.location.href);
var curr_uid = 'uid' in parsed_url ? parsed_url.uid : undefined;

function renderInbox() {
  db.ref('users').once('value', snap => {
    Promise.all(Object.keys(snap.val() ? snap.val() : {}).map(key => fetchProfile(key, snap.val(), isUser=true)))
    .then((ret) => {
      inbox = [];
      for (elem of ret) {
        if (elem.id === current_user.uid)
          continue;
        inbox.push(
          `<div class="d-flex align-items-center pb-1" id="tooltips-container">
            <img src="${elem.url}" class="rounded-circle img-fluid avatar-md img-thumbnail bg-transparent" alt="">
            <div class="w-100 ms-3">
              <h5 class="mb-1">${elem.snap[elem.id].username}</h5>
              <p class="mb-0 font-13">I've finished it! Thanks a lot for the hint!</p>
            </div>
            <a href="#" class="btn btn-sm btn-soft-info font-13" data-bs-container="#tooltips-container" data-bs-toggle="tooltip" data-bs-placement="left" title="" data-bs-original-title="Reply"> <i class="mdi mdi-reply"></i> </a>
          </div>`);
        break;
      }

      // Build the teams.
      $('#inbox').html(inbox.join('\n'));
    });
  });
}

function renderTeam() {
  db.ref('users').once('value', snap => {
    Promise.all(Object.keys(snap.val() ? snap.val() : {}).map(key => fetchProfile(key, snap.val(), isUser=true)))
    .then((ret) => {
      team = [];
      for (elem of ret) {
        if (elem.id === current_user.uid)
          continue;
        team.push( 
          `<a href="#" class="list-group-item list-group-item-action">
            <div class="d-flex align-items-center pb-1" id="tooltips-container">
              <img src="${elem.url}" class="rounded-circle img-fluid avatar-md img-thumbnail bg-transparent" alt="">
              <div class="w-100 ms-2">
                <h5 class="mb-1">@${elem.snap[elem.id].username}</h5>
              </div>
              <i class="mdi mdi-chevron-right h2"></i>
            </div>
          </a>`);
      }

      // Build the teams.
      $('#wsi-team').html(team.join('\n'));
      $('#tum-team').html(team.join('\n'));
    });
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

      // Refresh the uid.
      if (curr_uid === undefined)
        curr_uid = current_user.uid;

      forum = [];
      for (elem of ret) {
        if (elem.snap.user.uid !== curr_uid)
          continue;

        let dict = elem.snap;
        let shown_content = dict.content.slice(0, Math.min(dict.content.length, 128));
        let num_eyes = Math.floor(Math.random() * 50);

        let tagsWithColors = [];
        if (dict.tags.length) {
          for (tag of dict.tags.split(',')) {
            tagsWithColors.push(`<mark style='background: #F5F5F5; border-radius: 5px;'>#${tag}</mark>`);
          }
        }

        let add_info = '';
        if (dict.responses) {
          console.log(dict.responses);
          let last_reply = get_last_reply(dict.responses);
          console.log(last_reply);
          add_info = `<p class="text-muted">${last_reply.user.username} replied <span class="text-secondary font-weight-bold">${explainTime(last_reply.timestamp, 'ago')}</span></p>`;
        } else {
          console.log(`whatt??????`);
          console.log(elem.snap.user);
          add_info = `<p class="text-muted">${elem.snap.user.username} posted <span class="text-secondary font-weight-bold">${explainTime(dict.timestamp, 'ago')}</span></p>`;
        }

        forum.push(`
          <div class="border border-light p-2 mb-3 shadow">
            <div class="d-flex align-items-start">
              <img id='profile.${elem}' class="me-2 avatar-sm rounded-circle" src="${elem.url}" alt="Profile"/>
              <div class="w-100">
                <h6 class="m-0">${elem.snap.user.username}</h6>
                <div id='status.${elem.id}'>${add_info}</div>
              </div>
            </div>
            <p style="margin-left: 50px;">${dict.title}</p>
            <div style="margin-top: 25px;">
              ${(tagsWithColors.length) ? '<p>Tags: ' + tagsWithColors.join(' ') + '<p>' : ''}
            </div>
            <div class="mt-2">
              <a href="javascript: void(0);" class="btn btn-sm btn-link text-muted">${num_eyes} <i class="mdi mdi-star-outline"></i></a>
              <a href="javascript: void(0);" class="btn btn-sm btn-link text-muted"><i class="mdi mdi-reply-outline"></i> Reply</a>
              <a href="javascript: void(0);" class="btn btn-sm btn-link text-muted"><i class="mdi mdi-share-variant"></i> Share</a>
            </div>
          </div>`);
      }

      // Build the forum.
      $('#forum').html(forum.join('\n'));
    });
  });
}

renderForum();
renderTeam();
renderInbox();