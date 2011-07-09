The database is an object database with the following characteristics.

Each record contains a json stored set of data.  Arrays and
dictionaries are supported.

Each record can have any number of named pointers to other objects.

Each record can have any number of children.

To support named sets of children, a new record is created.  The
children are added to this new record.  This record is then added
to the parent record as a named pointer.

A record looks like the following
{
  _id: e4c9a6b0f12de,
  data: {
    first_name: John,
    last_name: Aughey,
  },
  named_children: {
    address: a1b2c3d4e5,
    spouse: 94b2e0f12fab,
    children: a6b9dec7e42
  },
  children: []
}

Records can be accessed by their path.  In the above example, the
address record can be accessed by the path e4c9a6b0f12de.address
This path can be arbitrarily deep with each dot separated name
accessing the record stored in the named_children section.

In the above example, the children record is likely a bucket record
(by convention) that contains the actual list of children.  For
example...

{
  _id: a6b9dec7e42,   // The id of the children record referenced above
  data: { }
  children: [
    a7b8d6f5e68,
    1d94bcd9a0e,
    aed94bcd9a0,
  ]
}

Bucket Records:  A bucket record is no different than a regular
record, but simply exists to contain pointers to other records.
This is a convention, not a specific data type.

Records are stored differently then typical realtional database.
Rather than storing the relation in the data field, records that
need to be logically grouped together are placed into bucket records.

For example, a tagging system wouldn't put the tag names directly
into a record, but would create a tag record and add the records
that have that tag as children of the tag record.  There might be
a tags record that contains the list of all tags in the system as
well as a top level database record with a named_child 'tags' that
points to the tags bucket record.
