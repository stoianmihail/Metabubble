// Set the tag from the parsed url.
var parsed_url = parse_url(window.location.href);

// Prefill the tags.
if ('tag' in parsed_url) {
  document.getElementById('custom-simple-tags').setAttribute('data-simple-tags', parsed_url['tag']);
} else {
  document.getElementById('custom-simple-tags').setAttribute('data-simple-tags', '');
}

async function createPost(args) {
  // Set the user.
  args['user'] = current_user;

  // Get a key for a new invoice.
  let key = firebase.database().ref().child('posts').push().key;

  // And update.
  let updates = {};
  updates['/posts/' + key] = args;
  return [args.tags, db.ref().update(updates)];
}

// Retrieve the user.
disableScreen();
retrieveCurrentUser(() => {}, {}, window.location.href, () => {
  // Enable the screen.
  enableScreen();

  // Use the fresh tags.
  window.location = 'forum.html' + (ret[0] === '' ? '' : '?tag=' + ret[0]); 
});

$('#post_button').on('click', (e) => {
  // At this point we're sure that we have an active user.
  e.preventDefault();
  e.stopPropagation();

  let args = {
    title: $('#title').val(),
    content: $('#content').val(),
    timestamp: getTimestamp(),
    tags: document.getElementById('custom-simple-tags').getAttribute('data-simple-tags')
  };

  disableScreen();
  createPost(args).then((ret) => {
    enableScreen();
    window.location = 'forum.html' + (ret[0] === '' ? '' : '?tag=' + ret[0]); 
  });
});