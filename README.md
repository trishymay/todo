# todo
Mean Stack To do list

localhost:3000

/user
  /createuser
    Post
      Required in body - email, username, password
      Creates new user


  /signin
    Post
      Required in body - username, password
      Returns token to authorized user


  /account
    Get
      Required in header - token
      Returns account info (username, email)

    Put
      Required in header - token
      Required in body - current password and either newEmail and/or newPassword
      Updates user supplied password and/or email

    Delete
      Required in header - token
      Required in body - password
      Removes user account including all lists and todo items


/todo
  /items/:listId
    Get
      Required in header - token
      Returns all items for one specific list

    Post
      Required in header - token
      Required in body - text
      Creates new list item

    Put
      Required in header - token
      Required in body - text, id (for item)
      Updates text of list item to newly supplied text

    Delete
      Required in header - token
      Required in body - id (for item)
      Removes specified list item


  /mylists
    Get
      Required in header - token
      Returns all lists for user

    Post
      Required in header - token
      Required in body - title, order
      Creates a new list

    Put
      Required in header - token
      Required in body - listId, (title and/or order)
      Updates user supplied title and/or order

    Delete
      Required in header - token
      Required in body - listId
      Removes specified list and all list items from that list


/admin
  /users
    Get
      Required in header - admin token
      Returns all users

    Put
      Required in header - admin token
      Required in body - username (which user to update), password and/or email (to be updated)
      Updates password and/or email address of specified user

    Delete
      Required in header - admin token
      Required in body - username (to be deleted)
      Removes specified user including all lists and todo items belonging to that user

  /items
    Get
      Required in header - admin token
      Returns all todo list items for all users

  /lists
    Get
      Required in header - admin token
      Returns all lists for all users
