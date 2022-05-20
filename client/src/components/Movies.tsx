import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createMovie, deleteMovie, getMovies, patchMovie } from '../api/movies-api'
import Auth from '../auth/Auth'
import { Movie } from '../types/Movie'

interface MoviesProps {
  auth: Auth
  history: History
}

interface MoviesState {
  movies: Movie[]
  newMovieName: string
  loadingMovies: boolean
}

export class Movies extends React.PureComponent<MoviesProps, MoviesState> {
  state: MoviesState = {
    movies: [],
    newMovieName: '',
    loadingMovies: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newMovieName: event.target.value })
  }

  onEditButtonClick = (movieId: string) => {
    this.props.history.push(`/movies/${movieId}/edit`)
  }

  onMovieCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const releaseDate = this.calculateDueDate()
      const newMovie = await createMovie(this.props.auth.getIdToken(), {
        name: this.state.newMovieName,
        releaseDate
      })
      this.setState({
        movies: [...this.state.movies, newMovie],
        newMovieName: ''
      })
    } catch {
      alert('Movie creation failed')
    }
  }

  onMovieDelete = async (movieId: string) => {
    try {
      await deleteMovie(this.props.auth.getIdToken(), movieId)
      this.setState({
        movies: this.state.movies.filter(movie => movie.movieId !== movieId)
      })
    } catch {
      alert('Movie deletion failed')
    }
  }

  onMovieCheck = async (pos: number) => {
    try {
      const movie = this.state.movies[pos]
      await patchMovie(this.props.auth.getIdToken(), movie.movieId, {
        name: movie.name,
        releaseDate: movie.releaseDate,
        status: !movie.status
      })
      this.setState({
        movies: update(this.state.movies, {
          [pos]: { status: { $set: !movie.status } }
        })
      })
    } catch {
      alert('Movie deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const movies = await getMovies(this.props.auth.getIdToken())
      this.setState({
        movies,
        loadingMovies: false
      })
    } catch (error) {
      let errorMessage = "Failed to do something exceptional";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Failed to fetch movies: ${errorMessage}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">MOVIEs</Header>

        {this.renderCreateMovieInput()}

        {this.renderMovies()}
      </div>
    )
  }

  renderCreateMovieInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onMovieCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderMovies() {
    if (this.state.loadingMovies) {
      return this.renderLoading()
    }

    return this.renderMoviesList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading MOVIEs
        </Loader>
      </Grid.Row>
    )
  }

  renderMoviesList() {
    return (
      <Grid padded>
        {this.state.movies.map((movie, pos) => {
          return (
            <Grid.Row key={movie.movieId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onMovieCheck(pos)}
                  checked={movie.status}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {movie.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {movie.releaseDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(movie.movieId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onMovieDelete(movie.movieId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {movie.attachmentUrl && (
                <Image src={movie.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
